import { Head, router, usePage } from '@inertiajs/react';
import {
    TrendingUp,
    DollarSign,
    CheckCircle2,
    Clock,
    Percent,
    Search,
    Calendar,
    Printer,
    Download,
    Eye,
    Filter,
    Users,
    Building2,
    Receipt,
    Wallet,
    AlertCircle,
    Check,
    CreditCard,
    ArrowUpRight,
    RefreshCw,
    X,
    Wrench,
    ShoppingCart,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface EmpleadoResumen {
    id: number;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    documento_numero: string | null;
    cargo: string | null;
    porcentaje_comision: number;
    porcentaje_comision_reparacion?: number;
    sucursal?: { id: number; nombre: string } | null;
    cantidad_ventas: number;
    ventas_totales: number;
    comision_ventas?: number;
    cantidad_reparaciones?: number;
    reparaciones_totales?: number;
    comision_reparaciones?: number;
    comisiones_generadas: number;
    comisiones_pendientes: number;
    comisiones_pagadas: number;
    tiene_pendientes: boolean;
}

interface VentaItem {
    id: number;
    codigo_ticket: string;
    cliente_nombre: string;
    total: number;
    subtotal: number;
    comision_porcentaje: number;
    comision_monto: number;
    comision_estado: 'pendiente' | 'pagada' | 'no_aplica';
    created_at: string;
    empleado?: {
        id: number;
        nombre_completo: string;
        cargo: string;
    } | null;
    comision_pago?: {
        id: number;
        codigo_recibo: string;
        fecha_pago: string;
    } | null;
}

interface ReparacionItem {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    marca_nombre: string;
    modelo_nombre: string;
    descripcion_falla?: string;
    observaciones_fisicas?: string;
    costo_mano_obra: number;
    costo_total: number;
    costo_estimado: number;
    comision_tecnico_pct?: number;
    comision_monto: number;
    comision_estado: 'pendiente' | 'pagada' | 'no_aplica';
    estado_orden: string;
    created_at: string;
    empleado?: {
        id: number;
        nombre_completo: string;
        cargo: string;
    } | null;
    tecnico?: {
        id: number;
        name: string;
    } | null;
    comision_pago?: {
        id: number;
        codigo_recibo: string;
        fecha_pago: string;
    } | null;
}

interface PagoReciente {
    id: number;
    codigo_recibo: string;
    monto_total: number;
    total_ventas_base: number;
    total_reparaciones_base?: number;
    cantidad_ventas: number;
    cantidad_reparaciones?: number;
    metodo_pago: string;
    fecha_pago: string;
    empleado?: {
        id: number;
        nombre_completo: string;
        documento_numero: string;
    } | null;
    user?: {
        name: string;
    } | null;
}

interface TicketData {
    id: number;
    codigo_recibo: string;
    fecha_pago: string;
    monto_total: number;
    total_ventas_base: number;
    total_reparaciones_base?: number;
    cantidad_ventas: number;
    cantidad_reparaciones?: number;
    metodo_pago: string;
    periodo_desde?: string | null;
    periodo_hasta?: string | null;
    notas?: string | null;
    empleado?: {
        id: number;
        nombre_completo: string;
        documento_tipo: string;
        documento_numero: string;
        cargo: string;
        porcentaje_comision: number;
        porcentaje_comision_reparacion?: number;
    } | null;
    empresa?: {
        razon_social: string;
        documento?: string;
        direccion?: string;
        telefono?: string;
        email?: string;
        logo?: string;
    } | null;
    sucursal?: {
        nombre: string;
        direccion?: string;
        telefono?: string;
    } | null;
    cajero?: {
        name: string;
    } | null;
    ventas_liquidadas?: Array<{
        id: number;
        codigo_ticket: string;
        fecha: string;
        total: number;
        comision_porcentaje: number;
        comision_monto: number;
    }>;
    reparaciones_liquidadas?: Array<{
        id: number;
        numero_orden: string;
        equipo: string;
        total: number;
        comision_monto: number;
    }>;
}

interface Props {
    stats: {
        total_ventas_monto: number;
        total_comisiones_generadas: number;
        comisiones_pendientes: number;
        comisiones_pagadas: number;
        cantidad_ventas: number;
        total_reparaciones_monto?: number;
        comisiones_ventas?: number;
        comisiones_reparaciones?: number;
        cantidad_reparaciones?: number;
        ventas_semaforo?: {
            total_ventas: number;
            ventas_pendientes: number;
            ventas_pagadas: number;
            total_generado: number;
            total_comisiones: number;
            pct_efectivo: number;
            pct_comision_input?: number;
        };
        taller_semaforo?: {
            reparados: number;
            no_reparados: number;
            en_proceso: number;
            total: number;
            total_generado: number;
            total_comisiones: number;
            pct_efectivo: number;
            pct_comision_input?: number;
            estados?: Record<string, number>;
        };
    };
    empleados_resumen: EmpleadoResumen[];
    ventas: {
        data: VentaItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    reparaciones?: {
        data: ReparacionItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    pagos_recientes: PagoReciente[];
    empleados_list: Array<{ id: number; nombre_completo: string; cargo: string; porcentaje_comision: number }>;
    sucursales: Array<{ id: number; nombre: string }>;
    activeRegister?: { id: number; status: string } | null;
    currencySymbol?: string;
    empresa?: {
        razon_social?: string;
        documento?: string;
        telefono?: string;
        email?: string;
        direccion?: string;
        logo?: string;
    } | null;
    filters: {
        empleado_id?: string;
        estado?: string;
        estado_orden?: string;
        from?: string;
        to?: string;
        search?: string;
        sucursal_id?: string;
        perPage?: number;
        tab?: string;
    };
    tab?: 'empleados' | 'ventas' | 'reparaciones' | 'pagos';
}

export const WORKSHOP_DETAILED_STATES = [
    { key: 'recibido', label: '1-Recibido', shortLabel: 'Recibido', step: '1', active: 'bg-blue-600 text-white border-blue-400' },
    { key: 'en_diagnostico_presupuesto', label: '2-Diagnóstico y Presupuesto', shortLabel: 'Diagnóstico', step: '2', active: 'bg-indigo-600 text-white border-indigo-400' },
    { key: 'confirmacion_presupuesto', label: '3-Confirmación Presupuesto', shortLabel: 'Conf. Presup.', step: '3', active: 'bg-purple-600 text-white border-purple-400' },
    { key: 'espera_refaccion', label: '4-Espera de Refacción', shortLabel: 'Espera Refac.', step: '4', active: 'bg-orange-600 text-white border-orange-400' },
    { key: 'en_reparacion', label: '5-En Reparación', shortLabel: 'En Reparación', step: '5', active: 'bg-amber-600 text-white border-amber-400' },
    { key: 'listo_reparado', label: '6-Listo Reparado', shortLabel: 'Listo Reparado', step: '6', active: 'bg-emerald-600 text-white border-emerald-400' },
    { key: 'listo_sin_solucion', label: '7-Listo Sin Solución', shortLabel: 'Sin Solución', step: '7', active: 'bg-rose-600 text-white border-rose-400' },
    { key: 'entregado_reparado', label: '8-Entregado Reparado', shortLabel: 'Entregado Rep.', step: '8', active: 'bg-teal-600 text-white border-teal-400' },
    { key: 'entregado_no_reparado', label: '9-Entregado No Reparado', shortLabel: 'No Reparado', step: '9', active: 'bg-red-600 text-white border-red-400' },
    { key: 'reincidencia_garantia', label: '10-Garantía / Reincidencia', shortLabel: 'Garantía', step: '10', active: 'bg-yellow-600 text-white border-yellow-400' },
];

export const WORKSHOP_CUT_STATES = [
    { key: 'listo_reparado', label: '6-Listo para Entregar Reparado', shortLabel: 'Listo para Entregar', step: '6', active: 'bg-emerald-600 text-white border-emerald-400' },
    { key: 'entregado_reparado', label: '8-Entregado Reparado', shortLabel: 'Entregado Reparado', step: '8', active: 'bg-teal-600 text-white border-teal-400' },
    { key: 'entregado_no_reparado', label: '9-Entregado No Reparado', shortLabel: 'Entregado No Reparado', step: '9', active: 'bg-rose-600 text-white border-rose-400' },
];

export default function ComisionesIndex({
    stats,
    empleados_resumen,
    ventas,
    reparaciones,
    pagos_recientes,
    empleados_list = [],
    sucursales = [],
    activeRegister,
    currencySymbol = '$',
    empresa,
    filters,
    tab: tabProp,
}: Props) {
    const { __ } = useTranslate();
    const pageProps = usePage().props as any;

    // Pestaña activa con persistencia inteligente
    const getInitialTab = (): 'empleados' | 'ventas' | 'reparaciones' | 'pagos' => {
        if (tabProp && ['empleados', 'ventas', 'reparaciones', 'pagos'].includes(tabProp)) {
            return tabProp;
        }
        if (filters?.tab && ['empleados', 'ventas', 'reparaciones', 'pagos'].includes(filters.tab)) {
            return filters.tab as any;
        }
        if (pageProps?.tab && ['empleados', 'ventas', 'reparaciones', 'pagos'].includes(pageProps.tab)) {
            return pageProps.tab as any;
        }
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const urlTab = urlParams.get('tab');
            if (urlTab && ['empleados', 'ventas', 'reparaciones', 'pagos'].includes(urlTab)) {
                return urlTab as any;
            }
            if (urlParams.has('page_reparaciones')) {
                return 'reparaciones';
            }
            if (urlParams.has('page_ventas')) {
                return 'ventas';
            }
        }
        return 'empleados';
    };

    const [activeTab, setActiveTab] = useState<'empleados' | 'ventas' | 'reparaciones' | 'pagos'>(getInitialTab);

    const handleTabChange = (newTab: 'empleados' | 'ventas' | 'reparaciones' | 'pagos') => {
        setActiveTab(newTab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', newTab);
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const urlTab = urlParams.get('tab');
            if (urlTab && ['empleados', 'ventas', 'reparaciones', 'pagos'].includes(urlTab)) {
                if (urlTab !== activeTab) {
                    setActiveTab(urlTab as any);
                }
            } else if (urlParams.has('page_reparaciones') && activeTab !== 'reparaciones') {
                setActiveTab('reparaciones');
            } else if (urlParams.has('page_ventas') && activeTab !== 'ventas') {
                setActiveTab('ventas');
            }
        }
    }, [pageProps?.url, tabProp, filters?.tab, ventas?.current_page, reparaciones?.current_page]);

    const handlePagination = (url: string | null, targetTab: 'ventas' | 'reparaciones') => {
        if (!url) return;
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('tab', targetTab);
        router.get(urlObj.pathname + urlObj.search, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Filtros
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState(filters.empleado_id || 'all');
    const [selectedEstado, setSelectedEstado] = useState(filters.estado || 'all');
    const [selectedEstadoOrden, setSelectedEstadoOrden] = useState(filters.estado_orden || 'all');
    const [selectedSucursal, setSelectedSucursal] = useState(filters.sucursal_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.from || '');
    const [dateTo, setDateTo] = useState(filters.to || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Modal de Liquidación / Pago
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payingEmpleado, setPayingEmpleado] = useState<EmpleadoResumen | null>(null);
    const [pendingSalesList, setPendingSalesList] = useState<any[]>([]);
    const [pendingRepairsList, setPendingRepairsList] = useState<any[]>([]);
    const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
    const [selectedReparacionIds, setSelectedReparacionIds] = useState<number[]>([]);
    const [isLoadingPendingSales, setIsLoadingPendingSales] = useState(false);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [registrarEgresoCaja, setRegistrarEgresoCaja] = useState(true);
    const [pagoNotas, setPagoNotas] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Modal de Ticket Térmico Imprimible
    const [ticketData, setTicketData] = useState<TicketData | null>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    // Modal de Hoja de Corte de Taller (Estilo Google Sheets Imagen 2)
    const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
    const [isSyncingTaller, setIsSyncingTaller] = useState(false);
    const selectedEmpleado = empleados_list.find((e) => String(e.id) === String(selectedEmpleadoId));

    // Porcentaje de comisión para cálculo automático en vivo y guardado en BD
    const initialComisionPct = (stats.taller_semaforo?.pct_comision_input !== undefined && stats.taller_semaforo?.pct_comision_input !== null)
        ? String(stats.taller_semaforo.pct_comision_input)
        : (stats.taller_semaforo?.pct_efectivo ? String(stats.taller_semaforo.pct_efectivo) : '10');

    const [customComisionPct, setCustomComisionPct] = useState<string>(initialComisionPct);
    const [isSavingPct, setIsSavingPct] = useState(false);
    const [justSavedPct, setJustSavedPct] = useState(false);
    const [overrideTotalComisiones, setOverrideTotalComisiones] = useState<number | null>(null);
    const autoSaveTimerRef = React.useRef<any>(null);

    useEffect(() => {
        if (stats.taller_semaforo?.pct_comision_input !== undefined && stats.taller_semaforo?.pct_comision_input !== null) {
            setCustomComisionPct(String(stats.taller_semaforo.pct_comision_input));
        } else if (stats.taller_semaforo?.pct_efectivo) {
            setCustomComisionPct(String(stats.taller_semaforo.pct_efectivo));
        }
        setOverrideTotalComisiones(null);
    }, [stats.taller_semaforo?.pct_comision_input, stats.taller_semaforo?.pct_efectivo, selectedEmpleadoId]);

    const saveCustomPercentageToBackend = async (pctValue: string) => {
        const parsed = parseFloat(pctValue);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) return;

        setIsSavingPct(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/admin/comisiones/actualizar-pct-taller', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    porcentaje: parsed,
                    empleado_id: selectedEmpleadoId !== 'all' ? selectedEmpleadoId : undefined,
                    sucursal_id: selectedSucursal !== 'all' ? selectedSucursal : undefined,
                    from: dateFrom || undefined,
                    to: dateTo || undefined,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setOverrideTotalComisiones(json.data.total_comisiones);
                }
                setJustSavedPct(true);
                setTimeout(() => setJustSavedPct(false), 2500);
            }
        } catch (err) {
            console.error('Error auto-saving workshop commission percentage', err);
        } finally {
            setIsSavingPct(false);
        }
    };

    const handlePctInputChange = (val: string) => {
        setCustomComisionPct(val);
        setOverrideTotalComisiones(null);

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
            saveCustomPercentageToBackend(val);
        }, 800);
    };

    const handlePctInputBlur = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        saveCustomPercentageToBackend(customComisionPct);
    };

    // Función de cálculo de comisión para una orden individual
    const getRepairCommission = (r: any) => {
        // Reincidencias y entregado no reparado nunca generan comisión
        const isReincidencia = Boolean(
            r.tuvo_reincidencia ||
            r.estado_orden === 'reincidencia_garantia' ||
            r.estado_orden === 'reincidencia'
        );
        const isNoReparado = r.estado_orden === 'entregado_no_reparado';

        if (isReincidencia || isNoReparado) {
            return 0;
        }

        const pct = parseFloat(customComisionPct);
        const effectivePct = !isNaN(pct) && pct >= 0 ? pct : Number(r.comision_tecnico_pct || 0);

        const total = Number(r.costo_total || r.costo_estimado || 0);
        const manoObra = Number(r.costo_mano_obra || 0);
        const base = manoObra > 0 ? manoObra : total;

        return Math.round(base * (effectivePct / 100) * 100) / 100;
    };

    // Total de comisiones técnico dinámico
    const dynamicTotalComisiones = React.useMemo(() => {
        if (overrideTotalComisiones !== null) {
            return overrideTotalComisiones;
        }
        const pct = parseFloat(customComisionPct);
        if (isNaN(pct) || pct < 0) {
            return Number(stats.taller_semaforo?.total_comisiones ?? stats.comisiones_reparaciones ?? 0);
        }

        const baseTotal = Number(stats.taller_semaforo?.total_generado ?? stats.total_reparaciones_monto ?? 0);
        return Math.round(baseTotal * (pct / 100) * 100) / 100;
    }, [overrideTotalComisiones, stats, customComisionPct]);

    const handleSyncTallerCommissions = () => {
        setIsSyncingTaller(true);
        router.post('/admin/comisiones/sync-taller', {
            porcentaje: parseFloat(customComisionPct) || undefined,
        }, {
            preserveScroll: true,
            onFinish: () => setIsSyncingTaller(false),
        });
    };

    // ── GESTIÓN DE PORCENTAJE Y COMISIONES DE VENTAS ──────────────────────────
    const initialSalesComisionPct = (stats.ventas_semaforo?.pct_comision_input !== undefined && stats.ventas_semaforo?.pct_comision_input !== null)
        ? String(stats.ventas_semaforo.pct_comision_input)
        : (stats.ventas_semaforo?.pct_efectivo ? String(stats.ventas_semaforo.pct_efectivo) : '5');

    const [customComisionPctVentas, setCustomComisionPctVentas] = useState<string>(initialSalesComisionPct);
    const [isSavingPctVentas, setIsSavingPctVentas] = useState(false);
    const [justSavedPctVentas, setJustSavedPctVentas] = useState(false);
    const [overrideTotalComisionesVentas, setOverrideTotalComisionesVentas] = useState<number | null>(null);
    const autoSaveTimerVentasRef = React.useRef<any>(null);
    const [isSyncingVentas, setIsSyncingVentas] = useState(false);
    const [isPrintSalesSheetOpen, setIsPrintSalesSheetOpen] = useState(false);

    useEffect(() => {
        if (stats.ventas_semaforo?.pct_comision_input !== undefined && stats.ventas_semaforo?.pct_comision_input !== null) {
            setCustomComisionPctVentas(String(stats.ventas_semaforo.pct_comision_input));
        } else if (stats.ventas_semaforo?.pct_efectivo) {
            setCustomComisionPctVentas(String(stats.ventas_semaforo.pct_efectivo));
        }
        setOverrideTotalComisionesVentas(null);
    }, [stats.ventas_semaforo?.pct_comision_input, stats.ventas_semaforo?.pct_efectivo, selectedEmpleadoId]);

    const saveSalesPercentageToBackend = async (pctValue: string) => {
        const parsed = parseFloat(pctValue);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) return;

        setIsSavingPctVentas(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/admin/comisiones/actualizar-pct-ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    porcentaje: parsed,
                    empleado_id: selectedEmpleadoId !== 'all' ? selectedEmpleadoId : undefined,
                    sucursal_id: selectedSucursal !== 'all' ? selectedSucursal : undefined,
                    from: dateFrom || undefined,
                    to: dateTo || undefined,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    setOverrideTotalComisionesVentas(json.data.total_comisiones);
                }
                setJustSavedPctVentas(true);
                setTimeout(() => setJustSavedPctVentas(false), 2500);
            }
        } catch (err) {
            console.error('Error auto-saving sales commission percentage', err);
        } finally {
            setIsSavingPctVentas(false);
        }
    };

    const handlePctVentasInputChange = (val: string) => {
        setCustomComisionPctVentas(val);
        setOverrideTotalComisionesVentas(null);

        if (autoSaveTimerVentasRef.current) {
            clearTimeout(autoSaveTimerVentasRef.current);
        }
        autoSaveTimerVentasRef.current = setTimeout(() => {
            saveSalesPercentageToBackend(val);
        }, 800);
    };

    const handlePctVentasInputBlur = () => {
        if (autoSaveTimerVentasRef.current) {
            clearTimeout(autoSaveTimerVentasRef.current);
        }
        saveSalesPercentageToBackend(customComisionPctVentas);
    };

    const getSaleCommission = (v: any) => {
        const pct = parseFloat(customComisionPctVentas);
        const effectivePct = !isNaN(pct) && pct >= 0 ? pct : Number(v.comision_porcentaje || 0);
        const total = Number(v.total || 0);
        return Math.round(total * (effectivePct / 100) * 100) / 100;
    };

    const dynamicTotalComisionesVentas = React.useMemo(() => {
        if (overrideTotalComisionesVentas !== null) {
            return overrideTotalComisionesVentas;
        }
        const pct = parseFloat(customComisionPctVentas);
        if (isNaN(pct) || pct < 0) {
            return Number(stats.ventas_semaforo?.total_comisiones ?? stats.comisiones_ventas ?? 0);
        }

        const baseTotal = Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0);
        return Math.round(baseTotal * (pct / 100) * 100) / 100;
    }, [overrideTotalComisionesVentas, stats, customComisionPctVentas]);

    const handleSyncVentasCommissions = () => {
        setIsSyncingVentas(true);
        router.post('/admin/comisiones/sync-ventas', {
            porcentaje: parseFloat(customComisionPctVentas) || undefined,
        }, {
            preserveScroll: true,
            onFinish: () => setIsSyncingVentas(false),
        });
    };


    // Presets rápidos de corte
    const handleQuickFilterSemana = () => {
        const now = new Date();
        const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
        const diffToSaturday = 6 - currentDay;
        const sat = new Date(now);
        sat.setDate(now.getDate() + diffToSaturday);

        const sun = new Date(sat);
        sun.setDate(sat.getDate() - 6);

        const fromStr = sun.toISOString().split('T')[0];
        const toStr = sat.toISOString().split('T')[0];

        setDateFrom(fromStr);
        setDateTo(toStr);
        handleApplyFilters({ from: fromStr, to: toStr });
    };

    const handleQuickFilterMesAnterior = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

        const fromStr = firstDay.toISOString().split('T')[0];
        const toStr = lastDay.toISOString().split('T')[0];

        setDateFrom(fromStr);
        setDateTo(toStr);
        handleApplyFilters({ from: fromStr, to: toStr });
    };

    const handleQuickFilterMesActual = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const fromStr = firstDay.toISOString().split('T')[0];
        const toStr = now.toISOString().split('T')[0];

        setDateFrom(fromStr);
        setDateTo(toStr);
        handleApplyFilters({ from: fromStr, to: toStr });
    };

    // Escuchar si el backend devolvió un comision_pago en la notificación flash
    useEffect(() => {
        const notif = pageProps?.notification || pageProps?.flash?.notification;
        if (notif?.comision_pago) {
            setTicketData(notif.comision_pago);
            setIsTicketModalOpen(true);
        }
    }, [pageProps?.notification, pageProps?.flash?.notification]);

    const searchDebounceRef = React.useRef<any>(null);

    const applyFiltersDirectly = (customParams: Record<string, any> = {}) => {
        const params: Record<string, any> = {
            empleado_id: customParams.empleado_id !== undefined ? customParams.empleado_id : selectedEmpleadoId,
            estado: customParams.estado !== undefined ? customParams.estado : selectedEstado,
            estado_orden: customParams.estado_orden !== undefined ? customParams.estado_orden : selectedEstadoOrden,
            sucursal_id: customParams.sucursal_id !== undefined ? customParams.sucursal_id : selectedSucursal,
            from: customParams.from !== undefined ? customParams.from : dateFrom,
            to: customParams.to !== undefined ? customParams.to : dateTo,
            search: customParams.search !== undefined ? customParams.search : searchTerm,
            tab: customParams.tab !== undefined ? customParams.tab : activeTab,
            ...customParams,
        };

        const cleanParams: Record<string, any> = {};
        Object.entries(params).forEach(([k, v]) => {
            if (v && v !== 'all') {
                cleanParams[k] = v;
            }
        });

        router.get('/admin/comisiones', cleanParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleApplyFilters = (customParams = {}) => {
        applyFiltersDirectly(customParams);
    };

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
            applyFiltersDirectly({ search: val || undefined });
        }, 400);
    };

    const handleFilterByEstadoOrden = (key: string) => {
        setSelectedEstadoOrden(key);
        applyFiltersDirectly({ estado_orden: key !== 'all' ? key : undefined });
    };

    const handleResetFilters = () => {
        setSelectedEmpleadoId('all');
        setSelectedEstado('all');
        setSelectedEstadoOrden('all');
        setSelectedSucursal('all');
        setDateFrom('');
        setDateTo('');
        setSearchTerm('');
        router.get('/admin/comisiones', { tab: activeTab }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Abrir modal de liquidación para un empleado
    const openPayoutModal = async (emp: EmpleadoResumen) => {
        setPayingEmpleado(emp);
        setIsLoadingPendingSales(true);
        setSelectedSaleIds([]);
        setSelectedReparacionIds([]);
        setMetodoPago('efectivo');
        setPagoNotas('');
        setIsPayModalOpen(true);

        try {
            const res = await fetch(`/admin/comisiones/empleado/${emp.id}/pendientes`);
            if (res.ok) {
                const data = await res.json();
                const sales = data.sales || [];
                const repairs = data.repairs || [];
                setPendingSalesList(sales);
                setPendingRepairsList(repairs);
                setSelectedSaleIds(sales.map((s: any) => s.id));
                setSelectedReparacionIds(repairs.map((r: any) => r.id));
            } else {
                notifyError(__('Error al consultar partidas pendientes.'));
            }
        } catch (err) {
            notifyError(__('Error de red al consultar partidas.'));
        } finally {
            setIsLoadingPendingSales(false);
        }
    };

    // Calcular suma seleccionada en el modal
    const salesCommissionCalculada = pendingSalesList
        .filter((s) => selectedSaleIds.includes(s.id))
        .reduce((sum, s) => sum + (Number(s.comision_monto) || 0), 0);

    const repairsCommissionCalculada = pendingRepairsList
        .filter((r) => selectedReparacionIds.includes(r.id))
        .reduce((sum, r) => sum + (Number(r.comision_monto) || 0), 0);

    const totalComisionCalculada = salesCommissionCalculada + repairsCommissionCalculada;

    const totalVentasBaseCalculada = pendingSalesList
        .filter((s) => selectedSaleIds.includes(s.id))
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    const totalReparacionesBaseCalculada = pendingRepairsList
        .filter((r) => selectedReparacionIds.includes(r.id))
        .reduce((sum, r) => sum + (Number(r.costo_total || r.costo_estimado || 0)), 0);

    const toggleSelectSale = (id: number) => {
        if (selectedSaleIds.includes(id)) {
            setSelectedSaleIds(selectedSaleIds.filter((sid) => sid !== id));
        } else {
            setSelectedSaleIds([...selectedSaleIds, id]);
        }
    };

    const toggleSelectRepair = (id: number) => {
        if (selectedReparacionIds.includes(id)) {
            setSelectedReparacionIds(selectedReparacionIds.filter((rid) => rid !== id));
        } else {
            setSelectedReparacionIds([...selectedReparacionIds, id]);
        }
    };

    const toggleSelectAll = () => {
        const allSalesSelected = selectedSaleIds.length === pendingSalesList.length;
        const allRepairsSelected = selectedReparacionIds.length === pendingRepairsList.length;

        if (allSalesSelected && allRepairsSelected) {
            setSelectedSaleIds([]);
            setSelectedReparacionIds([]);
        } else {
            setSelectedSaleIds(pendingSalesList.map((s) => s.id));
            setSelectedReparacionIds(pendingRepairsList.map((r) => r.id));
        }
    };

    const handleConfirmPayout = () => {
        if (!payingEmpleado) return;
        if (selectedSaleIds.length === 0 && selectedReparacionIds.length === 0) {
            notifyError(__('Debes seleccionar al menos una venta o reparación para liquidar.'));
            return;
        }

        setIsSubmittingPayment(true);
        router.post('/admin/comisiones/pagar', {
            empleado_id: payingEmpleado.id,
            sale_ids: selectedSaleIds,
            reparacion_ids: selectedReparacionIds,
            metodo_pago: metodoPago,
            cash_register_id: activeRegister?.id || null,
            registrar_egreso_caja: registrarEgresoCaja,
            notas: pagoNotas,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmittingPayment(false);
                setIsPayModalOpen(false);
            },
            onError: (err) => {
                setIsSubmittingPayment(false);
                notifyError(Object.values(err)[0] as string || __('Error al registrar el pago de comisiones.'));
            },
        });
    };

    // Ver ticket desde el historial de pagos
    const viewTicket = async (pagoId: number) => {
        try {
            const res = await fetch(`/admin/comisiones/ticket/${pagoId}`);
            if (res.ok) {
                const data = await res.json();
                setTicketData(data);
                setIsTicketModalOpen(true);
            } else {
                notifyError(__('No se pudo cargar el ticket.'));
            }
        } catch (e) {
            notifyError(__('Error al obtener ticket de pago.'));
        }
    };

    const breadcrumbs = [
        { title: __('Administración'), href: '/admin/dashboard' },
        { title: __('Comisiones por Ventas & Taller'), href: '/admin/comisiones' },
    ];

    return (
        <>
            <Head title={__('Módulo de Comisiones')} />

            <div className="space-y-6">
                {/* Migas de pan y Cabecera */}
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                    title={__('Comisiones de Empleados (Ventas POS & Taller)')}
                    description={__('Supervisa y liquida comisiones acumuladas tanto de ventas en mostrador como de servicios técnicos de reparación en taller.')}
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => router.get('/admin/empleados')}
                            className="gap-2"
                        >
                            <Users className="h-4 w-4" />
                            {__('Administrar Empleados')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Tarjetas de Estadísticas Principales */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={__('Volumen de Operaciones')}
                        value={`${currencySymbol}${Number((stats.total_ventas_monto || 0) + (stats.total_reparaciones_monto || 0)).toFixed(2)}`}
                        icon={<DollarSign className="h-6 w-6" />}
                        colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        description={`${stats.cantidad_ventas || 0} ${__('ventas')} • ${stats.cantidad_reparaciones || 0} ${__('reparaciones')}`}
                    />
                    <StatCard
                        title={__('Total Comisiones Acumuladas')}
                        value={`${currencySymbol}${Number(stats.total_comisiones_generadas).toFixed(2)}`}
                        icon={<Percent className="h-6 w-6" />}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        className="border-blue-500/20"
                        description={`${currencySymbol}${Number(stats.comisiones_ventas || 0).toFixed(2)} ${__('Ventas')} • ${currencySymbol}${Number(stats.comisiones_reparaciones || 0).toFixed(2)} ${__('Taller')}`}
                    />
                    <StatCard
                        title={__('Comisiones Pendientes')}
                        value={`${currencySymbol}${Number(stats.comisiones_pendientes).toFixed(2)}`}
                        icon={<Clock className="h-6 w-6" />}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        className="border-amber-500/30 shadow-sm"
                        description={__('Listas para liquidación en caja')}
                    />
                    <StatCard
                        title={__('Comisiones Pagadas')}
                        value={`${currencySymbol}${Number(stats.comisiones_pagadas).toFixed(2)}`}
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        className="border-emerald-500/30 shadow-sm"
                        description={__('Liquidadas con ticket entregado')}
                    />
                </div>

                {/* Barra de Filtros Avanzada */}
                <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Empleado */}
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">{__('Empleado')}</Label>
                            <Select
                                value={selectedEmpleadoId}
                                onValueChange={(val) => {
                                    setSelectedEmpleadoId(val);
                                    applyFiltersDirectly({ empleado_id: val });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Todos los empleados')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los empleados')}</SelectItem>
                                    {empleados_list.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.nombre_completo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estado de Comisión */}
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">{__('Estado')}</Label>
                            <Select
                                value={selectedEstado}
                                onValueChange={(val) => {
                                    setSelectedEstado(val);
                                    applyFiltersDirectly({ estado: val });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los estados')}</SelectItem>
                                    <SelectItem value="pendiente">{__('Solo Pendientes')}</SelectItem>
                                    <SelectItem value="pagada">{__('Solo Pagadas')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sucursal */}
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">{__('Sucursal')}</Label>
                            <Select
                                value={selectedSucursal}
                                onValueChange={(val) => {
                                    setSelectedSucursal(val);
                                    applyFiltersDirectly({ sucursal_id: val });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Todas')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todas las sucursales')}</SelectItem>
                                    {sucursales.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Rango Desde */}
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">{__('Desde')}</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDateFrom(val);
                                    applyFiltersDirectly({ from: val });
                                }}
                            />
                        </div>

                        {/* Rango Hasta */}
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">{__('Hasta')}</Label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDateTo(val);
                                    applyFiltersDirectly({ to: val });
                                }}
                            />
                        </div>
                    </div>

                    {/* Presets Rápidos de Corte */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                        <span className="text-xs font-semibold text-muted-foreground mr-1">⚡ {__('Cortes Rápidos:')}</span>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                            onClick={handleQuickFilterSemana}
                        >
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                            {__('Corte Semanal Taller (Sábado)')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                            onClick={handleQuickFilterMesAnterior}
                        >
                            <Calendar className="h-3.5 w-3.5 text-purple-600" />
                            {__('Mes Anterior (Recepción / Ventas)')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            onClick={handleQuickFilterMesActual}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            {__('Mes Actual')}
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <span>
                                {activeRegister ? (
                                    <>
                                        {__('Caja activa')} <span className="font-semibold text-foreground">#{activeRegister.id}</span> {__('disponible para registrar egresos de liquidación.')}
                                    </>
                                ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        ⚠️ {__('No tienes caja abierta actualmente. Las liquidaciones se registrarán como pago directo sin egreso en sesión de caja.')}
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 self-end">
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                {__('Filtros automáticos en tiempo real')}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleResetFilters}
                                title={__('Limpiar Filtros')}
                                className="gap-1.5 px-3 text-xs"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>{__('Limpiar')}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Pestañas de Vista: Por Empleado | Detalle de Ventas | Detalle de Taller | Pagos Recientes */}
                <Tabs value={activeTab} onValueChange={(v: any) => handleTabChange(v)} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
                        <TabsList className="bg-muted p-1">
                            <TabsTrigger value="empleados" className="gap-2 font-medium">
                                <Users className="h-4 w-4" />
                                {__('Resumen por Empleado')}
                            </TabsTrigger>
                            <TabsTrigger value="ventas" className="gap-2 font-medium">
                                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                                {__('Detalle de Ventas')} ({ventas.total})
                            </TabsTrigger>
                            <TabsTrigger value="reparaciones" className="gap-2 font-medium">
                                <Wrench className="h-4 w-4 text-indigo-600" />
                                {__('Detalle de Taller')} ({reparaciones?.total || 0})
                            </TabsTrigger>
                            <TabsTrigger value="pagos" className="gap-2 font-medium">
                                <Receipt className="h-4 w-4" />
                                {__('Historial de Liquidaciones')} ({pagos_recientes.length})
                            </TabsTrigger>
                        </TabsList>

                        {(activeTab === 'ventas' || activeTab === 'reparaciones') && (
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder={activeTab === 'ventas' ? __('Buscar ticket o cliente...') : __('Buscar folio o equipo...')}
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-8 h-9 text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* ── TAB 1: RESUMEN POR EMPLEADO ─────────────────────────────────── */}
                    <TabsContent value="empleados" className="space-y-4 m-0">
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-5 py-3.5">{__('Empleado')}</th>
                                            <th className="px-5 py-3.5">{__('Tasas de Comisión')}</th>
                                            <th className="px-5 py-3.5 text-center">{__('Desglose Operaciones')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Total Comisiones')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Pendiente por Pagar')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Pagado')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Acción')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {empleados_resumen.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                                    {__('No hay datos de empleados para los filtros seleccionados.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            empleados_resumen.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-foreground">
                                                            {emp.nombre_completo}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {emp.cargo || 'Empleado'} {emp.sucursal ? `• ${emp.sucursal.nombre}` : ''}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-3.5">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <Badge variant="outline" className="font-bold text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
                                                                <ShoppingCart className="w-3 h-3 mr-1 text-emerald-600" />
                                                                {Number(emp.porcentaje_comision).toFixed(1)}% Ventas
                                                            </Badge>
                                                            {Number(emp.porcentaje_comision_reparacion || 0) > 0 && (
                                                                <Badge variant="outline" className="font-bold text-[11px] text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30">
                                                                    <Wrench className="w-3 h-3 mr-1 text-indigo-600" />
                                                                    {Number(emp.porcentaje_comision_reparacion).toFixed(1)}% Taller
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="inline-flex items-center gap-2 text-xs">
                                                            <span className="font-semibold text-emerald-600" title="Ventas POS">
                                                                🛒 {emp.cantidad_ventas || 0}
                                                            </span>
                                                            <span className="text-muted-foreground">|</span>
                                                            <span className="font-semibold text-indigo-600" title="Reparaciones Taller">
                                                                🔧 {emp.cantidad_reparaciones || 0}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right font-bold text-foreground">
                                                        {currencySymbol}{Number(emp.comisiones_generadas).toFixed(2)}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right font-black">
                                                        {emp.comisiones_pendientes > 0 ? (
                                                            <span className="text-amber-600 dark:text-amber-400">
                                                                {currencySymbol}{Number(emp.comisiones_pendientes).toFixed(2)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">{currencySymbol}0.00</span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {currencySymbol}{Number(emp.comisiones_pagadas).toFixed(2)}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {emp.tiene_pendientes && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openPayoutModal(emp)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shadow-xs"
                                                                >
                                                                    <Wallet className="h-3.5 w-3.5" />
                                                                    {__('Liquidar')}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedEmpleadoId(String(emp.id));
                                                                    setActiveTab('ventas');
                                                                    handleApplyFilters({ empleado_id: String(emp.id) });
                                                                }}
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                {__('Detalles')}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── TAB 2: DETALLE DE VENTAS CON COMISIÓN (HOJA DE CORTE COMERCIAL) ── */}
                    <TabsContent value="ventas" className="space-y-4 m-0">
                        {/* ENCABEZADO ESTILO HOJA DE CORTE DE VENTAS */}
                        <div
                            className="rounded-2xl p-5 text-white shadow-xl border border-emerald-500/30"
                            style={{ background: 'linear-gradient(135deg, #0e1e24 0%, #102a32 50%, #0c1b22 100%)' }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                                                <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                                                {__('Hoja de Corte de Ventas y Rendimiento Comercial')}
                                            </span>
                                            {isSavingPctVentas && (
                                                <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-mono animate-pulse">
                                                    <RefreshCw className="h-3 w-3 animate-spin" /> {__('Guardando % en BD...')}
                                                </span>
                                            )}
                                            {justSavedPctVentas && (
                                                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                                                    <Check className="h-3.5 w-3.5" /> {__('Guardado')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-6 mt-1">
                                            {/* TOTAL GENERADO AL NEGOCIO */}
                                            <div>
                                                <div className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">
                                                    {__('TOTAL GENERADO AL NEGOCIO')}
                                                </div>
                                                <div className="text-3xl font-mono font-black text-white tracking-tight">
                                                    {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="hidden sm:block h-10 w-px bg-slate-700/60" />

                                            {/* TOTAL COMISIONES VENDEDOR */}
                                            <div>
                                                <div className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">
                                                    {__('TOTAL COMISIONES VENDEDOR')}
                                                </div>
                                                <div className="text-3xl font-mono font-black text-emerald-400 tracking-tight">
                                                    {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="hidden sm:block h-10 w-px bg-slate-700/60" />

                                            {/* % EFECTIVO COMISIÓN CON INPUT INTERACTIVO */}
                                            <div>
                                                <div className="text-[11px] uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                                                    <span>{__('% EFECTIVO COMISIÓN')}</span>
                                                    {isSavingPctVentas && <RefreshCw className="h-3 w-3 animate-spin text-emerald-300" />}
                                                    {justSavedPctVentas && <Check className="h-3 w-3 text-emerald-400" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex items-center">
                                                        <input
                                                            id="sales-commission-percentage-input"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.5"
                                                            value={customComisionPctVentas}
                                                            onChange={(e) => handlePctVentasInputChange(e.target.value)}
                                                            onBlur={handlePctVentasInputBlur}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur();
                                                                }
                                                            }}
                                                            className="w-24 bg-slate-800/90 hover:bg-slate-800 text-white font-mono font-black text-2xl lg:text-3xl px-2.5 py-1 rounded-xl border border-emerald-400/50 hover:border-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50 outline-none text-center shadow-inner transition-all"
                                                            title={__('Ingresa el porcentaje de comisión para calcular automáticamente en todas las ventas')}
                                                        />
                                                        <span className="ml-1.5 text-2xl lg:text-3xl font-mono font-black text-emerald-300">%</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 leading-tight">
                                                        <div>({__('de lo facturado')})</div>
                                                        <div className="text-[9px] text-emerald-300/80">{__('Auto-cálculo en vivo')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Casillas con las cantidades de ventas realizadas */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                    <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                                        {/* VERDE: Total Ventas Realizadas */}
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/90 text-white min-w-[95px] shadow-lg border border-emerald-400/40">
                                            <div className="text-2xl font-mono font-black leading-none">
                                                {stats.ventas_semaforo?.total_ventas ?? stats.cantidad_ventas ?? 0}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 mt-1 text-center">
                                                {__('Realizadas')}
                                            </div>
                                        </div>

                                        {/* TEAL: Ventas Pagadas */}
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-600/90 text-white min-w-[95px] shadow-lg border border-teal-400/40">
                                            <div className="text-2xl font-mono font-black leading-none">
                                                {stats.ventas_semaforo?.ventas_pagadas ?? 0}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-100 mt-1 text-center">
                                                {__('Pagadas')}
                                            </div>
                                        </div>

                                        {/* ÁMBAR: Ventas Pendientes */}
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-600/90 text-white min-w-[95px] shadow-lg border border-amber-400/40">
                                            <div className="text-2xl font-mono font-black leading-none">
                                                {stats.ventas_semaforo?.ventas_pendientes ?? 0}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-100 mt-1 text-center">
                                                {__('Pendientes')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                                        {/* Botón Sincronizar Comisiones */}
                                        <Button
                                            onClick={handleSyncVentasCommissions}
                                            disabled={isSyncingVentas}
                                            variant="outline"
                                            className="w-full sm:w-auto gap-2 bg-emerald-600/40 hover:bg-emerald-600/60 text-white font-bold shadow-md h-12 px-4 border border-emerald-400/30"
                                            title={__('Recalcula comisiones de ventas con el porcentaje configurado')}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isSyncingVentas ? 'animate-spin' : ''}`} />
                                            <span>{isSyncingVentas ? __('Sincronizando...') : __('Sincronizar Comisiones')}</span>
                                        </Button>

                                        {/* Botón Imprimir Hoja de Corte Ventas */}
                                        <Button
                                            onClick={() => setIsPrintSalesSheetOpen(true)}
                                            className="w-full sm:w-auto gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md h-12 px-4"
                                        >
                                            <Printer className="h-4 w-4 text-emerald-600" />
                                            <span>{__('Imprimir Hoja de Corte')}</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABLA DE VENTAS CON COMISIÓN */}
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-5 py-3.5">{__('Fecha')}</th>
                                            <th className="px-5 py-3.5 font-mono">{__('Ticket')}</th>
                                            <th className="px-5 py-3.5">{__('Cliente')}</th>
                                            <th className="px-5 py-3.5">{__('Vendedor')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Total Venta')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Comisión')}</th>
                                            <th className="px-5 py-3.5 text-center">{__('Estado')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {ventas.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                                    {__('No se encontraron ventas para los filtros aplicados.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            ventas.data.map((v) => {
                                                const itemComision = getSaleCommission(v);
                                                const effectivePct = parseFloat(customComisionPctVentas) > 0
                                                    ? parseFloat(customComisionPctVentas)
                                                    : Number(v.comision_porcentaje || 0);

                                                return (
                                                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                                                            {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>

                                                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                            {v.codigo_ticket}
                                                        </td>

                                                        <td className="px-5 py-3.5">
                                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                                                                {v.cliente_nombre || __('Cliente General')}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-3.5">
                                                            {v.empleado ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                                                                        {(v.empleado.nombre_completo || 'V')[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="font-semibold text-xs text-foreground truncate max-w-[140px]" title={v.empleado.nombre_completo}>
                                                                            {v.empleado.nombre_completo}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                                            {v.empleado.cargo || __('Vendedor')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">{__('Sin Vendedor')}</span>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-3.5 text-right font-semibold text-foreground whitespace-nowrap font-mono">
                                                            {currencySymbol}{Number(v.total).toFixed(2)}
                                                        </td>

                                                        <td className="px-5 py-3.5 text-right font-black whitespace-nowrap">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                                                    +{currencySymbol}{itemComision.toFixed(2)}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                                    ({effectivePct.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                            {v.comision_estado === 'pagada' ? (
                                                                <div className="inline-flex items-center gap-1">
                                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        {__('Pagada')}
                                                                    </Badge>
                                                                    {v.comision_pago && (
                                                                        <button
                                                                            onClick={() => viewTicket(v.comision_pago!.id)}
                                                                            title={__('Ver Ticket de Liquidación: ') + v.comision_pago.codigo_recibo}
                                                                            className="text-xs text-primary underline ml-1 cursor-pointer font-mono"
                                                                        >
                                                                            {v.comision_pago.codigo_recibo}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {__('Pendiente')}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot className="bg-muted/40 font-bold border-t text-xs">
                                        <tr>
                                            <td colSpan={4} className="px-5 py-3 text-right uppercase text-muted-foreground">
                                                {__('TOTALES CORTE VENTAS:')}
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono text-foreground">
                                                {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                                {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3" />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Paginación */}
                            {ventas.last_page > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
                                    <div>
                                        {__('Mostrando')} <span className="font-semibold text-foreground">{ventas.data.length}</span> {__('de')}{' '}
                                        <span className="font-semibold text-foreground">{ventas.total}</span> {__('ventas')}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            disabled={!ventas.prev_page_url}
                                            onClick={() => handlePagination(ventas.prev_page_url, 'ventas')}
                                        >
                                            {__('Anterior')}
                                        </Button>

                                        {ventas.links && ventas.links.length > 3 ? (
                                            ventas.links
                                                .filter((l) => !l.label.includes('&laquo;') && !l.label.includes('&raquo;') && !l.label.includes('Previous') && !l.label.includes('Next'))
                                                .map((link, idx) => {
                                                    const isDots = link.label === '...';
                                                    return isDots ? (
                                                        <span key={idx} className="px-1 text-muted-foreground text-xs">...</span>
                                                    ) : (
                                                        <Button
                                                            key={idx}
                                                            variant={link.active ? "default" : "outline"}
                                                            size="sm"
                                                            className={`h-8 min-w-[32px] px-2 text-xs font-semibold ${
                                                                link.active
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                    : ''
                                                            }`}
                                                            disabled={!link.url || link.active}
                                                            onClick={() => handlePagination(link.url, 'ventas')}
                                                        >
                                                            {link.label}
                                                        </Button>
                                                    );
                                                })
                                        ) : (
                                            <span className="font-medium text-foreground px-2">
                                                {ventas.current_page} / {ventas.last_page}
                                            </span>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            disabled={!ventas.next_page_url}
                                            onClick={() => handlePagination(ventas.next_page_url, 'ventas')}
                                        >
                                            {__('Siguiente')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── TAB 3: DETALLE DE TALLER & REPARACIONES (HOJA DE CORTE SEMANAL) ───────────────────────── */}
                    <TabsContent value="reparaciones" className="space-y-4 m-0">
                        {/* BANNER ESTILO HOJA DE CÁLCULO (IMAGEN 2) */}
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-indigo-900/50">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                {/* Datos Financieros: Total Generado vs Comisiones y % */}
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                        <Wrench className="h-3.5 w-3.5 text-indigo-400" />
                                        <span>{__('Hoja de Corte de Taller y Rendimiento Técnico')}</span>
                                    </div>
                                    <div className="flex flex-wrap items-baseline gap-6 pt-1">
                                        <div>
                                            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                                                {__('Total Generado al Negocio')}
                                            </div>
                                            <div className="text-3xl lg:text-4xl font-mono font-black text-white">
                                                {currencySymbol}{Number(stats.taller_semaforo?.total_generado ?? stats.total_reparaciones_monto ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="border-l border-slate-700 pl-6">
                                            <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                                                {__('Total Comisiones Técnico')}
                                            </div>
                                            <div className="text-3xl lg:text-4xl font-mono font-black text-emerald-400">
                                                {currencySymbol}{Number(dynamicTotalComisiones).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="border-l border-slate-700 pl-6">
                                            <div className="text-xs uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
                                                <Percent className="h-3.5 w-3.5 text-indigo-400" />
                                                <span>{__('% Efectivo Comisión')}</span>
                                                {isSavingPct ? (
                                                    <span className="flex items-center gap-1 text-[10px] text-amber-300 normal-case font-normal bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                                                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                                                        {__('Guardando...')}
                                                    </span>
                                                ) : justSavedPct ? (
                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 normal-case font-normal bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/30">
                                                        <Check className="h-2.5 w-2.5" />
                                                        {__('Guardado')}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2 pt-1.5">
                                                <div className="relative flex items-center">
                                                    <input
                                                        id="workshop-commission-percentage-input"
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="100"
                                                        value={customComisionPct}
                                                        onChange={(e) => handlePctInputChange(e.target.value)}
                                                        onBlur={handlePctInputBlur}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                        className="w-24 bg-slate-800/90 hover:bg-slate-800 text-white font-mono font-black text-2xl lg:text-3xl px-2.5 py-1 rounded-xl border border-indigo-400/50 hover:border-indigo-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none text-center shadow-inner transition-all"
                                                        title={__('Ingresa el porcentaje de comisión para calcular automáticamente en todas las reparaciones')}
                                                    />
                                                    <span className="ml-1.5 text-2xl lg:text-3xl font-mono font-black text-indigo-300">%</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 leading-tight">
                                                    <div>({__('de lo facturado')})</div>
                                                    <div className="text-[9px] text-indigo-300/80">{__('Auto-cálculo en vivo')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Semáforo de Equipos (Idéntico a las casillas de la Imagen 2) */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                    <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                                        {/* VERDE: Reparados */}
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/90 text-white min-w-[95px] shadow-lg border border-emerald-400/40">
                                            <div className="text-2xl font-mono font-black leading-none">
                                                {stats.taller_semaforo?.reparados ?? 0}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 mt-1 text-center">
                                                {__('Reparados')}
                                            </div>
                                        </div>

                                        {/* ROJO: No Reparados */}
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-600/90 text-white min-w-[95px] shadow-lg border border-rose-400/40">
                                            <div className="text-2xl font-mono font-black leading-none">
                                                {stats.taller_semaforo?.no_reparados ?? 0}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-100 mt-1 text-center">
                                                {__('No Reparados')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                                        {/* Botón Sincronizar Comisiones */}
                                        <Button
                                            onClick={handleSyncTallerCommissions}
                                            disabled={isSyncingTaller}
                                            variant="outline"
                                            className="w-full sm:w-auto gap-2 bg-indigo-600/40 hover:bg-indigo-600/60 text-white font-bold shadow-md h-12 px-4 border border-indigo-400/30"
                                            title={__('Vincula las órdenes con su técnico y recalcula comisiones pendientes')}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isSyncingTaller ? 'animate-spin' : ''}`} />
                                            <span>{isSyncingTaller ? __('Sincronizando...') : __('Sincronizar Comisiones')}</span>
                                        </Button>

                                        {/* Botón Imprimir Hoja de Corte */}
                                        <Button
                                            onClick={() => setIsPrintSheetOpen(true)}
                                            className="w-full sm:w-auto gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md h-12 px-4"
                                        >
                                            <Printer className="h-4 w-4 text-indigo-600" />
                                            <span>{__('Imprimir Hoja de Corte')}</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* DESGLOSE DE LOS 3 ESTADOS VÁLIDOS DE CORTE DE TALLER */}
                            <div className="mt-5 pt-4 border-t border-indigo-900/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-indigo-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                            {__('Estados de Corte de Taller')}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            • {__('Solo se muestran: Listo para Entregar, Entregado Reparado y Entregado No Reparado')}
                                        </span>
                                    </div>

                                    {selectedEstadoOrden !== 'all' && (
                                        <button
                                            type="button"
                                            onClick={() => handleFilterByEstadoOrden('all')}
                                            className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-400/40"
                                        >
                                            <X className="h-3 w-3" />
                                            <span>{__('Ver los 3 estados')}</span>
                                        </button>
                                    )}
                                </div>

                                {/* Grilla con los 3 Estados de Taller */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {WORKSHOP_CUT_STATES.map((st) => {
                                        const count = stats.taller_semaforo?.estados?.[st.key] ?? 0;
                                        const isSelected = selectedEstadoOrden === st.key;

                                        return (
                                            <button
                                                key={st.key}
                                                type="button"
                                                onClick={() => handleFilterByEstadoOrden(isSelected ? 'all' : st.key)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden group shadow-md",
                                                    isSelected
                                                        ? "ring-2 ring-white scale-[1.02] " + st.active
                                                        : count > 0
                                                            ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-indigo-400/60"
                                                            : "bg-slate-900/40 text-slate-500 border-slate-800/40 opacity-70 hover:opacity-100"
                                                )}
                                                title={`${st.label}: ${count} órdenes`}
                                            >
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-tight text-slate-200">
                                                        {st.label}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {st.key === 'entregado_no_reparado' ? __('No genera comisión') : __('Genera comisión')}
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-mono font-black text-white pl-4">
                                                    {count}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>


                        {/* TABLA PRINCIPAL DE TALLER */}
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-3.5">{__('Fecha')}</th>
                                            <th className="px-4 py-3.5 font-mono">{__('# Folio')}</th>
                                            <th className="px-4 py-3.5">{__('Cliente')}</th>
                                            <th className="px-4 py-3.5">{__('Técnico')}</th>
                                            <th className="px-4 py-3.5">{__('Modelo')}</th>
                                            <th className="px-4 py-3.5">{__('Reparación / Falla')}</th>
                                            <th className="px-4 py-3.5 text-center">{__('Status')}</th>
                                            <th className="px-4 py-3.5">{__('Observación')}</th>
                                            <th className="px-4 py-3.5 text-right">{__('Total Orden')}</th>
                                            <th className="px-4 py-3.5 text-right">{__('Comisión')}</th>
                                            <th className="px-4 py-3.5 text-center">{__('Estado')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {!reparaciones || reparaciones.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="text-center py-12 text-muted-foreground">
                                                    <Wrench className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                                    {__('No se encontraron órdenes de reparación para los filtros aplicados.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            reparaciones.data.map((r) => {
                                                const isReincidencia = Boolean(
                                                    r.tuvo_reincidencia ||
                                                    r.estado_orden === 'reincidencia_garantia' ||
                                                    r.estado_orden === 'reincidencia'
                                                );
                                                const isNoReparado = r.estado_orden === 'entregado_no_reparado';
                                                const isListoReparado = ['listo_reparado', 'reparado'].includes(r.estado_orden);
                                                const isEntregadoReparado = ['entregado_reparado', 'entregado_finalizado', 'entregado'].includes(r.estado_orden);

                                                const itemComision = getRepairCommission(r);
                                                const effectivePct = parseFloat(customComisionPct) > 0
                                                    ? parseFloat(customComisionPct)
                                                    : Number(r.comision_tecnico_pct || 0);

                                                return (
                                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                            {new Date(r.created_at).toLocaleDateString()}
                                                        </td>

                                                        <td className="px-4 py-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                                                            {r.numero_orden}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200">
                                                                {r.cliente_nombre || __('Cliente General')}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {r.empleado ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-200 dark:border-indigo-800">
                                                                        {(r.empleado.nombre_completo || 'T')[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="font-semibold text-xs text-foreground truncate max-w-[140px]" title={r.empleado.nombre_completo}>
                                                                            {r.empleado.nombre_completo}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                                            {r.empleado.cargo || __('Técnico')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : r.tecnico ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200">
                                                                        {(r.tecnico.name || 'T')[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="font-semibold text-xs text-foreground truncate max-w-[140px]" title={r.tecnico.name}>
                                                                        {r.tecnico.name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">{__('Sin asignar')}</span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 font-semibold text-foreground">
                                                            {r.marca_nombre} {r.modelo_nombre}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={r.descripcion_falla || ''}>
                                                            {r.descripcion_falla || __('Servicio Técnico')}
                                                        </td>

                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {isReincidencia ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300 border border-pink-300" title={__('Reincidencia / Garantía de servicio previo')}>
                                                                    🔄 {__('REINCIDENCIA')}
                                                                </span>
                                                            ) : isNoReparado ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300">
                                                                    🔴 {__('NO REPARADO')}
                                                                </span>
                                                            ) : isListoReparado ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300">
                                                                    🟢 {__('LISTO REPARADO')}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-300">
                                                                    🟢 {__('ENTREGADO REP.')}
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={r.observaciones_fisicas || ''}>
                                                            {r.observaciones_fisicas || '-'}
                                                        </td>

                                                        <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                                                            {currencySymbol}{Number(r.costo_total || r.costo_estimado || 0).toFixed(2)}
                                                        </td>

                                                        <td className="px-4 py-3 text-right font-black whitespace-nowrap">
                                                            {isReincidencia ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-slate-400 font-mono">{currencySymbol}0.00</span>
                                                                    <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">
                                                                        {__('Reincidencia (0%)')}
                                                                    </span>
                                                                </div>
                                                            ) : isNoReparado ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-slate-400 font-mono">{currencySymbol}0.00</span>
                                                                    <span className="text-[10px] font-bold text-rose-500">
                                                                        {__('No Reparado (0%)')}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                                                        +{currencySymbol}{itemComision.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                                        ({effectivePct.toFixed(1)}%)
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {r.comision_estado === 'pagada' ? (
                                                                <div className="inline-flex items-center gap-1">
                                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        {__('Pagada')}
                                                                    </Badge>
                                                                    {r.comision_pago && (
                                                                        <button
                                                                            onClick={() => viewTicket(r.comision_pago!.id)}
                                                                            title={__('Ver Ticket de Liquidación: ') + r.comision_pago.codigo_recibo}
                                                                            className="text-xs text-primary underline ml-1 cursor-pointer"
                                                                        >
                                                                            {r.comision_pago.codigo_recibo}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {__('Pendiente')}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación Reparaciones */}
                            {reparaciones && reparaciones.last_page > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
                                    <div>
                                        {__('Mostrando')} <span className="font-semibold text-foreground">{reparaciones.data.length}</span> {__('de')}{' '}
                                        <span className="font-semibold text-foreground">{reparaciones.total}</span> {__('reparaciones')}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            disabled={!reparaciones.prev_page_url}
                                            onClick={() => handlePagination(reparaciones.prev_page_url, 'reparaciones')}
                                        >
                                            {__('Anterior')}
                                        </Button>

                                        {reparaciones.links && reparaciones.links.length > 3 ? (
                                            reparaciones.links
                                                .filter((l) => !l.label.includes('&laquo;') && !l.label.includes('&raquo;') && !l.label.includes('Previous') && !l.label.includes('Next'))
                                                .map((link, idx) => {
                                                    const isDots = link.label === '...';
                                                    return isDots ? (
                                                        <span key={idx} className="px-1 text-muted-foreground text-xs">...</span>
                                                    ) : (
                                                        <Button
                                                            key={idx}
                                                            variant={link.active ? "default" : "outline"}
                                                            size="sm"
                                                            className={`h-8 min-w-[32px] px-2 text-xs font-semibold ${
                                                                link.active
                                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                                    : ''
                                                            }`}
                                                            disabled={!link.url || link.active}
                                                            onClick={() => handlePagination(link.url, 'reparaciones')}
                                                        >
                                                            {link.label}
                                                        </Button>
                                                    );
                                                })
                                        ) : (
                                            <span className="font-medium text-foreground px-2">
                                                {reparaciones.current_page} / {reparaciones.last_page}
                                            </span>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2.5 text-xs"
                                            disabled={!reparaciones.next_page_url}
                                            onClick={() => handlePagination(reparaciones.next_page_url, 'reparaciones')}
                                        >
                                            {__('Siguiente')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── TAB 4: HISTORIAL DE LIQUIDACIONES / PAGOS ────────────────────── */}
                    <TabsContent value="pagos" className="space-y-4 m-0">
                        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-5 py-3.5">{__('Recibo N°')}</th>
                                            <th className="px-5 py-3.5">{__('Fecha de Pago')}</th>
                                            <th className="px-5 py-3.5">{__('Empleado')}</th>
                                            <th className="px-5 py-3.5 text-center">{__('Partidas Liquidadas')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Bases')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Monto Pagado')}</th>
                                            <th className="px-5 py-3.5">{__('Método')}</th>
                                            <th className="px-5 py-3.5 text-right">{__('Acciones')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {pagos_recientes.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-10 text-muted-foreground">
                                                    {__('Aún no se han registrado liquidaciones de comisiones.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            pagos_recientes.map((p) => (
                                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                        {p.codigo_recibo}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                                        {new Date(p.fecha_pago).toLocaleDateString()} {new Date(p.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>

                                                    <td className="px-5 py-3.5 font-semibold text-foreground">
                                                        {p.empleado?.nombre_completo || __('Empleado')}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex flex-col gap-0.5 items-center">
                                                            {p.cantidad_ventas > 0 && (
                                                                <Badge variant="secondary" className="text-[10px]">
                                                                    🛒 {p.cantidad_ventas} {__('ventas')}
                                                                </Badge>
                                                            )}
                                                            {(p.cantidad_reparaciones || 0) > 0 && (
                                                                <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30">
                                                                    🔧 {p.cantidad_reparaciones} {__('taller')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs">
                                                        {currencySymbol}{Number((p.total_ventas_base || 0) + (p.total_reparaciones_base || 0)).toFixed(2)}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                                                        {currencySymbol}{Number(p.monto_total).toFixed(2)}
                                                    </td>

                                                    <td className="px-5 py-3.5 uppercase text-xs font-semibold text-muted-foreground">
                                                        {p.metodo_pago}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => viewTicket(p.id)}
                                                            className="gap-1.5 text-xs font-semibold"
                                                        >
                                                            <Printer className="h-3.5 w-3.5 text-primary" />
                                                            {__('Ver Ticket')}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── MODAL: LIQUIDACIÓN / PAGO DE COMISIONES HÍBRIDAS ─────────────────── */}
            <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Receipt className="h-5 w-5 text-emerald-600" />
                            {__('Liquidar Comisiones')} - {payingEmpleado?.nombre_completo}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Selecciona las partidas de Ventas POS y Reparaciones de Taller a liquidar en efectivo o transferencia.')}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingPendingSales ? (
                        <div className="py-12 text-center text-muted-foreground space-y-2">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                            <p>{__('Cargando partidas pendientes del empleado...')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-2">
                            {/* Resumen Superior */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-lg border text-xs">
                                <div>
                                    <span className="text-muted-foreground block">{__('Empleado:')}</span>
                                    <span className="font-semibold text-sm">{payingEmpleado?.nombre_completo}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">{__('Tasa Ventas:')}</span>
                                    <Badge variant="outline" className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30">
                                        🛒 {Number(payingEmpleado?.porcentaje_comision).toFixed(1)}%
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">{__('Tasa Taller:')}</span>
                                    <Badge variant="outline" className="font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30">
                                        🔧 {Number(payingEmpleado?.porcentaje_comision_reparacion || 0).toFixed(1)}%
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">{__('Partidas:')}</span>
                                    <span className="font-bold text-primary">
                                        {pendingSalesList.length} ventas • {pendingRepairsList.length} taller
                                    </span>
                                </div>
                            </div>

                            {/* Botón Seleccionar Todo */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
                                <span>{__('Partidas Pendientes de Pago:')}</span>
                                <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    className="text-primary hover:underline cursor-pointer"
                                >
                                    {selectedSaleIds.length === pendingSalesList.length && selectedReparacionIds.length === pendingRepairsList.length
                                        ? __('Deseleccionar todos')
                                        : __('Seleccionar todos')}
                                </button>
                            </div>

                            {/* Sección 1: Ventas POS Pendientes */}
                            {pendingSalesList.length > 0 && (
                                <div className="space-y-1.5 border rounded-xl p-3 bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/20">
                                    <div className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                                            {__('Ventas en Mostrador (POS)')} ({pendingSalesList.length})
                                        </span>
                                        <span className="text-muted-foreground font-normal">
                                            {selectedSaleIds.length} {__('seleccionadas')}
                                        </span>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto divide-y border rounded-lg bg-card">
                                        {pendingSalesList.map((sale) => {
                                            const isSelected = selectedSaleIds.includes(sale.id);
                                            return (
                                                <div
                                                    key={sale.id}
                                                    onClick={() => toggleSelectSale(sale.id)}
                                                    className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-emerald-500/10' : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                                        />
                                                        <div>
                                                            <div className="font-mono font-bold text-foreground">
                                                                {sale.codigo_ticket}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {new Date(sale.created_at).toLocaleDateString()} • {sale.cliente_nombre || 'Cliente General'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            +{currencySymbol}{Number(sale.comision_monto).toFixed(2)}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {__('Venta:')} {currencySymbol}{Number(sale.total).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sección 2: Reparaciones de Taller Pendientes */}
                            {pendingRepairsList.length > 0 && (
                                <div className="space-y-1.5 border rounded-xl p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-500/20">
                                    <div className="font-bold text-xs text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Wrench className="w-4 h-4 text-indigo-600" />
                                            {__('Reparaciones en Taller')} ({pendingRepairsList.length})
                                        </span>
                                        <span className="text-muted-foreground font-normal">
                                            {selectedReparacionIds.length} {__('seleccionadas')}
                                        </span>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto divide-y border rounded-lg bg-card">
                                        {pendingRepairsList.map((repair) => {
                                            const isSelected = selectedReparacionIds.includes(repair.id);
                                            return (
                                                <div
                                                    key={repair.id}
                                                    onClick={() => toggleSelectRepair(repair.id)}
                                                    className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-indigo-500/10' : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                        />
                                                        <div>
                                                            <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                                {repair.numero_orden}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                {repair.marca_nombre} {repair.modelo_nombre} • {repair.cliente_nombre || 'Cliente General'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                                            +{currencySymbol}{Number(repair.comision_monto).toFixed(2)}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {__('Total:')} {currencySymbol}{Number(repair.costo_total || repair.costo_estimado).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Total Calculado */}
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-muted-foreground block">{__('Total a Liquidar:')}</span>
                                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                        {currencySymbol}{totalComisionCalculada.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {__('Ventas:')} {currencySymbol}{salesCommissionCalculada.toFixed(2)} • {__('Taller:')} {currencySymbol}{repairsCommissionCalculada.toFixed(2)}
                                    </div>
                                </div>

                                <div className="text-right text-xs">
                                    <Badge variant="outline" className="font-bold">
                                        {selectedSaleIds.length + selectedReparacionIds.length} {__('partidas marcadas')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Opciones de Pago */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <Label className="text-xs">{__('Método de Pago')}</Label>
                                    <Select value={metodoPago} onValueChange={(val) => setMetodoPago(val)}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="efectivo">{__('Efectivo')}</SelectItem>
                                            <SelectItem value="transferencia">{__('Transferencia Bancaria')}</SelectItem>
                                            <SelectItem value="otro">{__('Otro Método')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">{__('Notas Adicionales')}</Label>
                                    <Input
                                        placeholder={__('Ej. Pago quincenal de comisiones')}
                                        value={pagoNotas}
                                        onChange={(e) => setPagoNotas(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Switch de Egreso en Caja */}
                            {activeRegister && (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                    <div className="space-y-0.5">
                                        <div className="text-xs font-semibold">{__('Registrar egreso en Caja Registradora')}</div>
                                        <div className="text-[11px] text-muted-foreground">
                                            {__('Descontará')} {currencySymbol}{totalComisionCalculada.toFixed(2)} {__('del saldo de la caja actual #')}{activeRegister.id}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={registrarEgresoCaja}
                                        onCheckedChange={setRegistrarEgresoCaja}
                                    />
                                </div>
                            )}

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPayModalOpen(false)}
                                    disabled={isSubmittingPayment}
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    onClick={handleConfirmPayout}
                                    disabled={isSubmittingPayment || (selectedSaleIds.length === 0 && selectedReparacionIds.length === 0)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                                >
                                    {isSubmittingPayment ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {__('Confirmar Liquidación')}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── MODAL: COMPROBANTE DE PAGO TÉRMICO ─────────────────────────────── */}
            <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Receipt className="h-5 w-5 text-emerald-600" />
                            {__('Comprobante de Liquidación Generado')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {__('Ticket listo para imprimir y entregar al empleado.')}
                        </DialogDescription>
                    </DialogHeader>

                    {ticketData && (
                        <div className="space-y-4 pt-2">
                            {/* Vista Previa del Ticket en pantalla */}
                            <div className="bg-muted/40 p-4 rounded-xl border border-dashed font-mono text-xs space-y-3">
                                <div className="text-center space-y-0.5">
                                    <div className="font-black text-sm uppercase">{ticketData.empresa?.razon_social || 'FixSale POS'}</div>
                                    {ticketData.empresa?.documento && <div className="text-[10px] text-muted-foreground">{ticketData.empresa.documento}</div>}
                                    {ticketData.sucursal?.nombre && (
                                        <div className="text-[10px] text-muted-foreground">{ticketData.sucursal.nombre}</div>
                                    )}
                                    <div className="border-b border-dashed my-1"></div>
                                    <div className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        {__('RECIBO DE PAGO DE COMISIÓN')}
                                    </div>
                                    <div className="font-bold">{ticketData.codigo_recibo}</div>
                                    <div className="text-[10px] text-muted-foreground">{ticketData.fecha_pago}</div>
                                </div>

                                <div className="border-b border-dashed"></div>

                                {/* Datos del Empleado */}
                                <div className="space-y-0.5 text-[11px]">
                                    <div><span className="text-muted-foreground">{__('Empleado:')}</span> <span className="font-bold">{ticketData.empleado?.nombre_completo}</span></div>
                                    {ticketData.empleado?.documento_numero && (
                                        <div><span className="text-muted-foreground">{__('Documento:')}</span> {ticketData.empleado.documento_numero}</div>
                                    )}
                                    <div><span className="text-muted-foreground">{__('Cargo:')}</span> {ticketData.empleado?.cargo || 'Empleado'}</div>
                                </div>

                                <div className="border-b border-dashed"></div>

                                {/* Desglose de Partidas */}
                                <div className="space-y-1">
                                    <div className="font-semibold text-[10px] text-muted-foreground uppercase">{__('Partidas Liquidadas:')}</div>
                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                        {ticketData.ventas_liquidadas?.map((v) => (
                                            <div key={`v-${v.id}`} className="flex justify-between items-center text-[11px]">
                                                <span>🛒 {v.codigo_ticket}</span>
                                                <span className="font-bold text-right">
                                                    +{currencySymbol}{Number(v.comision_monto).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                        {ticketData.reparaciones_liquidadas?.map((r) => (
                                            <div key={`r-${r.id}`} className="flex justify-between items-center text-[11px]">
                                                <span>🔧 {r.numero_orden}</span>
                                                <span className="font-bold text-right text-indigo-600">
                                                    +{currencySymbol}{Number(r.comision_monto).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-b border-dashed"></div>

                                {/* Totales */}
                                <div className="space-y-1 text-right">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">{__('Bases:')}</span>
                                        <span>{currencySymbol}{Number((ticketData.total_ventas_base || 0) + (ticketData.total_reparaciones_base || 0)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">{__('Forma de Pago:')}</span>
                                        <span className="uppercase font-semibold">{ticketData.metodo_pago}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black pt-1 border-t border-dashed text-emerald-600 dark:text-emerald-400">
                                        <span>{__('TOTAL PAGADO:')}</span>
                                        <span>{currencySymbol}{Number(ticketData.monto_total).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="border-b border-dashed pt-2"></div>

                                {/* Firmas */}
                                <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px]">
                                    <div>
                                        <div className="border-t border-dashed pt-1">
                                            {__('Firma Empleado')}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground">{__('Recibí Conforme')}</div>
                                    </div>
                                    <div>
                                        <div className="border-t border-dashed pt-1">
                                            {__('Firma y Sello')}
                                        </div>
                                        <div className="text-[9px] text-muted-foreground">{ticketData.cajero?.name || 'Administración'}</div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full font-bold gap-2"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4 text-primary" />
                                    {__('Imprimir Ticket Térmico')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full font-bold"
                                    onClick={() => setIsTicketModalOpen(false)}
                                >
                                    {__('Cerrar')}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── MODAL DE PREVISUALIZACIÓN DE HOJA DE CORTE DE TALLER (ESTILO GOOGLE SHEETS) ────── */}
            <Dialog open={isPrintSheetOpen} onOpenChange={setIsPrintSheetOpen}>
                <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-muted/40 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <Wrench className="h-5 w-5 text-indigo-600" />
                                <span>{__('Hoja de Corte de Taller - Rendimiento y Liquidación')}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {__('Formato ejecutivo estilo hoja de cálculo para auditoría y firma de comisiones.')}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => window.print()}
                                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9"
                            >
                                <Printer className="h-4 w-4" />
                                <span>{__('Imprimir / Guardar PDF')}</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* CONTENEDOR PREVIEW EN PANTALLA */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
                        <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-lg border p-6 font-sans">
                            {/* ENCABEZADO EMPRESA */}
                            <div className="flex items-start justify-between border-b pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-black uppercase text-indigo-900 tracking-wide">
                                        {empresa?.razon_social || 'FixSale POS - Taller Técnico'}
                                    </h2>
                                    <div className="text-xs text-slate-500 font-medium space-y-0.5 mt-1">
                                        {empresa?.documento && <div><b>ID / RFC:</b> {empresa.documento}</div>}
                                        {empresa?.direccion && <div><b>Ubicación:</b> {empresa.direccion}</div>}
                                        {empresa?.telefono && <div><b>Contacto:</b> {empresa.telefono}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded bg-indigo-100 text-indigo-900 text-xs font-black uppercase tracking-wider mb-1">
                                        {__('CORTE DE COMISIONES')}
                                    </span>
                                    <div className="text-xs text-slate-600 font-medium">
                                        <b>{__('Período:')}</b> {dateFrom || 'Inicio'} {__('al')} {dateTo || 'Hoy'}
                                    </div>
                                    <div className="text-xs text-slate-600 font-medium">
                                        <b>{__('Técnico:')}</b> {selectedEmpleado?.nombre_completo || __('Consolidado de Taller')}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        {__('Fecha Emisión:')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {/* RESUMEN FINANCIERO Y SEMÁFORO (IDÉNTICO A IMAGEN 2) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Tarjeta Totales */}
                                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {__('Total Facturado Taller')}
                                        </div>
                                        <div className="text-2xl font-mono font-black">
                                            {currencySymbol}{Number(stats.taller_semaforo?.total_generado ?? stats.total_reparaciones_monto ?? 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-right border-l border-slate-700 pl-4">
                                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                                            {__('Total Comisiones')}
                                        </div>
                                        <div className="text-2xl font-mono font-black text-emerald-400">
                                            {currencySymbol}{Number(dynamicTotalComisiones).toFixed(2)}
                                        </div>
                                        <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                                            {customComisionPct ? `${Number(customComisionPct).toFixed(2)}% ${__('Comisión')}` : `${Number(stats.taller_semaforo?.pct_efectivo ?? 0).toFixed(2)}% ${__('Efectivo')}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Semáforo de Casillas */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600 text-white text-center">
                                        <div className="text-2xl font-black font-mono leading-none">
                                            {stats.taller_semaforo?.reparados ?? 0}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase mt-1">
                                            {__('Reparados')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-600 text-white text-center">
                                        <div className="text-2xl font-black font-mono leading-none">
                                            {stats.taller_semaforo?.no_reparados ?? 0}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase mt-1">
                                            {__('No Reparados')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desglose de Estados de Corte en Hoja de Impresión */}
                            <div className="mb-4 bg-slate-50 border border-slate-300 rounded-lg p-2.5">
                                <div className="text-[10px] font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                                    <span>{__('Estados Incluidos en Corte de Taller:')}</span>
                                    <span className="font-mono text-slate-500 font-normal">{__('Total Equipos:')} {stats.taller_semaforo?.total ?? 0}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {WORKSHOP_CUT_STATES.map((st) => {
                                        const count = stats.taller_semaforo?.estados?.[st.key] ?? 0;
                                        return (
                                            <div key={st.key} className="border border-slate-200 bg-white rounded p-1.5">
                                                <div className="font-mono font-bold text-sm text-slate-800">{count}</div>
                                                <div className="text-[10px] text-slate-600 font-medium truncate" title={st.label}>{st.shortLabel}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TABLA ESTILO HOJA DE CÁLCULO */}
                            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                        <tr>
                                            <th className="p-2 border-r border-slate-200">{__('Fecha')}</th>
                                            <th className="p-2 border-r border-slate-200 font-mono">{__('Folio')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Cliente')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Técnico')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Modelo')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Reparación / Falla')}</th>
                                            <th className="p-2 border-r border-slate-200 text-center">{__('Status')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Observación')}</th>
                                            <th className="p-2 border-r border-slate-200 text-right">{__('Total')}</th>
                                            <th className="p-2 text-right">{__('Comisión')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {!reparaciones || reparaciones.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="text-center py-8 text-slate-400">
                                                    {__('No hay órdenes registradas en este período.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            reparaciones.data.map((r, i) => {
                                                const isReincidencia = Boolean(
                                                    r.tuvo_reincidencia ||
                                                    r.estado_orden === 'reincidencia_garantia' ||
                                                    r.estado_orden === 'reincidencia'
                                                );
                                                const isNoReparado = r.estado_orden === 'entregado_no_reparado';
                                                const isListoReparado = ['listo_reparado', 'reparado'].includes(r.estado_orden);
                                                const itemComision = getRepairCommission(r);

                                                return (
                                                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                                        <td className="p-2 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                                                            {new Date(r.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-700">
                                                            {r.numero_orden}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 font-medium">
                                                            {r.cliente_nombre || __('Cliente General')}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                                            {r.empleado?.nombre_completo || r.tecnico?.name || __('Sin asignar')}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200">
                                                            {r.marca_nombre} {r.modelo_nombre}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-slate-600 max-w-[180px] truncate" title={r.descripcion_falla}>
                                                            {r.descripcion_falla || __('Servicio de taller')}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-center whitespace-nowrap">
                                                            {isReincidencia ? (
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-pink-100 text-pink-800 border border-pink-300">
                                                                    🔄 {__('REINCIDENCIA')}
                                                                </span>
                                                            ) : isNoReparado ? (
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                                                    🔴 {__('NO REPARADO')}
                                                                </span>
                                                            ) : isListoReparado ? (
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                                    🟢 {__('LISTO REP.')}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                                                                    🟢 {__('ENTREGADO REP.')}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-slate-500 max-w-[150px] truncate">
                                                            {r.observaciones_fisicas || '-'}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">
                                                            {currencySymbol}{Number(r.costo_total || r.costo_estimado || 0).toFixed(2)}
                                                        </td>
                                                        <td className="p-2 text-right font-mono font-bold text-emerald-700">
                                                            {isReincidencia || isNoReparado ? (
                                                                <span className="text-slate-400 font-mono text-xs">{currencySymbol}0.00</span>
                                                            ) : (
                                                                <span>{currencySymbol}{itemComision.toFixed(2)}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                                        <tr>
                                            <td colSpan={8} className="p-2 text-right text-slate-700 uppercase">
                                                {__('TOTALES CORTE:')}
                                            </td>
                                            <td className="p-2 text-right font-mono text-slate-900 border-r border-slate-200">
                                                {currencySymbol}{Number(stats.taller_semaforo?.total_generado ?? 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-mono text-emerald-700">
                                                {currencySymbol}{Number(dynamicTotalComisiones).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* FIRMAS DE CONFORMIDAD Y AUDITORÍA */}
                            <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
                                <div>
                                    <div className="border-t-2 border-slate-400 pt-2 font-bold text-slate-800 uppercase">
                                        {selectedEmpleado?.nombre_completo || __('Firma del Técnico Responsable')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {__('Recibí Conforme / Comisión Liquidada')}
                                    </div>
                                </div>
                                <div>
                                    <div className="border-t-2 border-slate-400 pt-2 font-bold text-slate-800 uppercase">
                                        {empresa?.razon_social || __('Administración / Taller')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {__('Aprobado y Pagado')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── PLANTILLA OFICIAL DE IMPRESIÓN HOJA DE CORTE DE TALLER (@media print) ────── */}
            {isPrintSheetOpen && (
                <div id="printable-workshop-sheet" className="hidden print:block text-black bg-white font-sans p-6 text-xs w-full max-w-[280mm] mx-auto">
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            #printable-workshop-sheet, #printable-workshop-sheet * {
                                visibility: visible !important;
                            }
                            #printable-workshop-sheet {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 8mm !important;
                                background: white !important;
                                color: black !important;
                                font-family: Arial, Helvetica, sans-serif !important;
                                font-size: 10px !important;
                            }
                            @page {
                                size: letter landscape;
                                margin: 8mm;
                            }
                        }
                    `}</style>

                    {/* ENCABEZADO EMPRESA PRINT */}
                    <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
                        <div>
                            <h2 className="text-lg font-black uppercase text-black tracking-wide">
                                {empresa?.razon_social || 'FixSale POS - Taller Técnico'}
                            </h2>
                            <div className="text-[10px] text-gray-700 font-medium space-y-0.5 mt-0.5">
                                {empresa?.documento && <div><b>ID / RFC:</b> {empresa.documento}</div>}
                                {empresa?.direccion && <div><b>Ubicación:</b> {empresa.direccion}</div>}
                                {empresa?.telefono && <div><b>Contacto:</b> {empresa.telefono}</div>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-black uppercase border border-black px-2 py-0.5 inline-block mb-1">
                                {__('HOJA DE CORTE DE COMISIONES')}
                            </div>
                            <div className="text-[10px] text-gray-800">
                                <b>{__('Período:')}</b> {dateFrom || 'Inicio'} {__('al')} {dateTo || 'Hoy'}
                            </div>
                            <div className="text-[10px] text-gray-800">
                                <b>{__('Técnico:')}</b> {selectedEmpleado?.nombre_completo || __('Consolidado de Taller')}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-0.5">
                                {__('Emitido:')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    {/* RESUMEN FINANCIERO Y SEMÁFORO PRINT */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="border border-black p-2 flex items-center justify-between">
                            <div>
                                <div className="text-[9px] uppercase font-bold text-gray-600">
                                    {__('Total Facturado Taller')}
                                </div>
                                <div className="text-lg font-mono font-black">
                                    {currencySymbol}{Number(stats.taller_semaforo?.total_generado ?? stats.total_reparaciones_monto ?? 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right border-l border-gray-400 pl-3">
                                <div className="text-[9px] uppercase font-bold text-gray-700">
                                    {__('Total Comisiones')}
                                </div>
                                <div className="text-lg font-mono font-black">
                                    {currencySymbol}{Number(dynamicTotalComisiones).toFixed(2)}
                                </div>
                                <div className="text-[9px] font-bold">
                                    {customComisionPct ? `${Number(customComisionPct).toFixed(2)}%` : `${Number(stats.taller_semaforo?.pct_efectivo ?? 0).toFixed(2)}%`} {__('Efectivo')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                            <div className="border-2 border-black p-1 text-center bg-gray-100">
                                <div className="text-base font-black font-mono leading-none">
                                    {stats.taller_semaforo?.reparados ?? 0}
                                </div>
                                <div className="text-[8px] font-black uppercase mt-0.5">
                                    {__('Reparados')}
                                </div>
                            </div>
                            <div className="border-2 border-black p-1 text-center bg-gray-100">
                                <div className="text-base font-black font-mono leading-none">
                                    {stats.taller_semaforo?.no_reparados ?? 0}
                                </div>
                                <div className="text-[8px] font-black uppercase mt-0.5">
                                    {__('No Reparados')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLA PRINT */}
                    <table className="w-full text-[10px] text-left border-collapse border border-black mb-4">
                        <thead className="bg-gray-100 font-bold border-b border-black">
                            <tr>
                                <th className="p-1 border border-black">{__('Fecha')}</th>
                                <th className="p-1 border border-black font-mono">{__('Folio')}</th>
                                <th className="p-1 border border-black">{__('Cliente')}</th>
                                <th className="p-1 border border-black">{__('Modelo')}</th>
                                <th className="p-1 border border-black">{__('Reparación / Falla')}</th>
                                <th className="p-1 border border-black text-center">{__('Status')}</th>
                                <th className="p-1 border border-black">{__('Observación')}</th>
                                <th className="p-1 border border-black text-right">{__('Total')}</th>
                                <th className="p-1 border border-black text-right">{__('Comisión')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!reparaciones || reparaciones.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-4 text-gray-500 border border-black">
                                        {__('No hay órdenes registradas en este período.')}
                                    </td>
                                </tr>
                            ) : (
                                reparaciones.data.map((r) => {
                                    const isReincidencia = Boolean(
                                        r.tuvo_reincidencia ||
                                        r.estado_orden === 'reincidencia_garantia' ||
                                        r.estado_orden === 'reincidencia'
                                    );
                                    const isNoReparado = r.estado_orden === 'entregado_no_reparado';
                                    const isListoReparado = ['listo_reparado', 'reparado'].includes(r.estado_orden);
                                    const itemComision = getRepairCommission(r);

                                    return (
                                        <tr key={`print-r-${r.id}`}>
                                            <td className="p-1 border border-black whitespace-nowrap">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-1 border border-black font-mono font-bold">
                                                {r.numero_orden}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {r.cliente_nombre || __('Cliente General')}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {r.marca_nombre} {r.modelo_nombre}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {r.descripcion_falla || __('Servicio de taller')}
                                            </td>
                                            <td className="p-1 border border-black text-center font-bold">
                                                {isReincidencia ? 'REINCIDENCIA' : isNoReparado ? 'NO REPARADO' : isListoReparado ? 'LISTO REP.' : 'ENTREGADO REP.'}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {r.observaciones_fisicas || '-'}
                                            </td>
                                            <td className="p-1 border border-black text-right font-mono">
                                                {currencySymbol}{Number(r.costo_total || r.costo_estimado || 0).toFixed(2)}
                                            </td>
                                            <td className="p-1 border border-black text-right font-mono font-bold">
                                                {isReincidencia || isNoReparado ? (
                                                    <span className="text-gray-500 font-normal">{currencySymbol}0.00</span>
                                                ) : (
                                                    <span>{currencySymbol}{itemComision.toFixed(2)}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot className="font-bold border-t-2 border-black bg-gray-100">
                            <tr>
                                <td colSpan={7} className="p-1 text-right border border-black uppercase">
                                    {__('TOTALES:')}
                                </td>
                                <td className="p-1 text-right font-mono border border-black">
                                    {currencySymbol}{Number(stats.taller_semaforo?.total_generado ?? 0).toFixed(2)}
                                </td>
                                <td className="p-1 text-right font-mono border border-black">
                                    {currencySymbol}{Number(dynamicTotalComisiones).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* FIRMAS PRINT */}
                    <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
                        <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">
                                {selectedEmpleado?.nombre_completo || __('Firma del Técnico Responsable')}
                            </div>
                            <div className="text-[10px] text-gray-600">
                                {__('Recibí Conforme / Comisión Liquidada')}
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">
                                {empresa?.razon_social || __('Administración / Taller')}
                            </div>
                            <div className="text-[10px] text-gray-600">
                                {__('Aprobado y Pagado')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL DE PREVISUALIZACIÓN DE HOJA DE CORTE DE VENTAS ────── */}
            <Dialog open={isPrintSalesSheetOpen} onOpenChange={setIsPrintSalesSheetOpen}>
                <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b bg-muted/40 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                <span>{__('Hoja de Corte de Ventas - Rendimiento y Liquidación')}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {__('Formato ejecutivo estilo hoja de cálculo para auditoría y firma de comisiones de ventas.')}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => window.print()}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9"
                            >
                                <Printer className="h-4 w-4" />
                                <span>{__('Imprimir / Guardar PDF')}</span>
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* CONTENEDOR PREVIEW EN PANTALLA */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
                        <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-lg border p-6 font-sans">
                            {/* ENCABEZADO EMPRESA */}
                            <div className="flex items-start justify-between border-b pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-black uppercase text-emerald-900 tracking-wide">
                                        {empresa?.razon_social || 'FixSale POS - Área Comercial'}
                                    </h2>
                                    <div className="text-xs text-slate-500 font-medium space-y-0.5 mt-1">
                                        {empresa?.documento && <div><b>ID / RFC:</b> {empresa.documento}</div>}
                                        {empresa?.direccion && <div><b>Ubicación:</b> {empresa.direccion}</div>}
                                        {empresa?.telefono && <div><b>Contacto:</b> {empresa.telefono}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider mb-1">
                                        {__('CORTE DE COMISIONES DE VENTAS')}
                                    </span>
                                    <div className="text-xs text-slate-600 font-medium">
                                        <b>{__('Período:')}</b> {dateFrom || 'Inicio'} {__('al')} {dateTo || 'Hoy'}
                                    </div>
                                    <div className="text-xs text-slate-600 font-medium">
                                        <b>{__('Vendedor:')}</b> {selectedEmpleado?.nombre_completo || __('Consolidado Comercial')}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1">
                                        {__('Emitido:')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {/* RESUMEN FINANCIERO Y CASILLAS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {__('Total Facturado Ventas')}
                                        </div>
                                        <div className="text-2xl font-mono font-black">
                                            {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-right border-l border-slate-700 pl-4">
                                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                                            {__('Total Comisiones')}
                                        </div>
                                        <div className="text-2xl font-mono font-black text-emerald-400">
                                            {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                        </div>
                                        <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                                            {customComisionPctVentas ? `${Number(customComisionPctVentas).toFixed(2)}% ${__('Comisión')}` : `${Number(stats.ventas_semaforo?.pct_efectivo ?? 0).toFixed(2)}% ${__('Efectivo')}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Casillas de Cantidades */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600 text-white text-center">
                                        <div className="text-2xl font-black font-mono leading-none">
                                            {stats.ventas_semaforo?.total_ventas ?? stats.cantidad_ventas ?? 0}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase mt-1">
                                            {__('Realizadas')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-600 text-white text-center">
                                        <div className="text-2xl font-black font-mono leading-none">
                                            {stats.ventas_semaforo?.ventas_pagadas ?? 0}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase mt-1">
                                            {__('Pagadas')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500 text-white text-center">
                                        <div className="text-2xl font-black font-mono leading-none">
                                            {stats.ventas_semaforo?.ventas_pendientes ?? 0}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase mt-1">
                                            {__('Pendientes')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABLA ESTILO HOJA DE CÁLCULO */}
                            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                        <tr>
                                            <th className="p-2 border-r border-slate-200">{__('Fecha')}</th>
                                            <th className="p-2 border-r border-slate-200 font-mono">{__('Ticket')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Cliente')}</th>
                                            <th className="p-2 border-r border-slate-200">{__('Vendedor')}</th>
                                            <th className="p-2 border-r border-slate-200 text-right">{__('Total Venta')}</th>
                                            <th className="p-2 text-right">{__('Comisión')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {!ventas || ventas.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-slate-400">
                                                    {__('No hay ventas registradas en este período.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            ventas.data.map((v, i) => {
                                                const itemComision = getSaleCommission(v);

                                                return (
                                                    <tr key={`sales-preview-${v.id}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                                        <td className="p-2 border-r border-slate-200 text-slate-600 whitespace-nowrap">
                                                            {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-emerald-700">
                                                            {v.codigo_ticket}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 font-medium">
                                                            {v.cliente_nombre || __('Cliente General')}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                                            {v.empleado?.nombre_completo || __('Sin Vendedor')}
                                                        </td>
                                                        <td className="p-2 border-r border-slate-200 text-right font-mono font-medium">
                                                            {currencySymbol}{Number(v.total).toFixed(2)}
                                                        </td>
                                                        <td className="p-2 text-right font-mono font-bold text-emerald-700">
                                                            {currencySymbol}{itemComision.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                                        <tr>
                                            <td colSpan={4} className="p-2 text-right text-slate-700 uppercase">
                                                {__('TOTALES CORTE VENTAS:')}
                                            </td>
                                            <td className="p-2 text-right font-mono text-slate-900 border-r border-slate-200">
                                                {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right font-mono text-emerald-700">
                                                {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* FIRMAS DE CONFORMIDAD Y AUDITORÍA */}
                            <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
                                <div>
                                    <div className="border-t-2 border-slate-400 pt-2 font-bold text-slate-800 uppercase">
                                        {selectedEmpleado?.nombre_completo || __('Firma del Vendedor Responsable')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {__('Recibí Conforme / Comisión Liquidada')}
                                    </div>
                                </div>
                                <div>
                                    <div className="border-t-2 border-slate-400 pt-2 font-bold text-slate-800 uppercase">
                                        {empresa?.razon_social || __('Administración / Área Comercial')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        {__('Aprobado y Pagado')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── PLANTILLA OFICIAL DE IMPRESIÓN HOJA DE CORTE DE VENTAS (@media print) ────── */}
            {isPrintSalesSheetOpen && (
                <div id="printable-sales-sheet" className="hidden print:block text-black bg-white font-sans p-6 text-xs w-full max-w-[280mm] mx-auto">
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            #printable-sales-sheet, #printable-sales-sheet * {
                                visibility: visible !important;
                            }
                            #printable-sales-sheet {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 8mm !important;
                                background: white !important;
                                color: black !important;
                                font-family: Arial, Helvetica, sans-serif !important;
                                font-size: 10px !important;
                            }
                            @page {
                                size: letter landscape;
                                margin: 8mm;
                            }
                        }
                    `}</style>

                    {/* ENCABEZADO EMPRESA PRINT */}
                    <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-3">
                        <div>
                            <h2 className="text-lg font-black uppercase text-black tracking-wide">
                                {empresa?.razon_social || 'FixSale POS - Área Comercial'}
                            </h2>
                            <div className="text-[10px] text-gray-700 font-medium space-y-0.5 mt-0.5">
                                {empresa?.documento && <div><b>ID / RFC:</b> {empresa.documento}</div>}
                                {empresa?.direccion && <div><b>Ubicación:</b> {empresa.direccion}</div>}
                                {empresa?.telefono && <div><b>Contacto:</b> {empresa.telefono}</div>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-black uppercase border border-black px-2 py-0.5 inline-block mb-1">
                                {__('HOJA DE CORTE DE COMISIONES - VENTAS')}
                            </div>
                            <div className="text-[10px] text-gray-800">
                                <b>{__('Período:')}</b> {dateFrom || 'Inicio'} {__('al')} {dateTo || 'Hoy'}
                            </div>
                            <div className="text-[10px] text-gray-800">
                                <b>{__('Vendedor:')}</b> {selectedEmpleado?.nombre_completo || __('Consolidado Comercial')}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-0.5">
                                {__('Emitido:')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    {/* RESUMEN FINANCIERO PRINT */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="border border-black p-2 flex items-center justify-between">
                            <div>
                                <div className="text-[9px] uppercase font-bold text-gray-600">
                                    {__('Total Facturado Ventas')}
                                </div>
                                <div className="text-lg font-mono font-black">
                                    {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right border-l border-gray-400 pl-3">
                                <div className="text-[9px] uppercase font-bold text-gray-700">
                                    {__('Total Comisiones')}
                                </div>
                                <div className="text-lg font-mono font-black">
                                    {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                </div>
                                <div className="text-[9px] font-bold">
                                    {customComisionPctVentas ? `${Number(customComisionPctVentas).toFixed(2)}%` : `${Number(stats.ventas_semaforo?.pct_efectivo ?? 0).toFixed(2)}%`} {__('Efectivo')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                            <div className="border-2 border-black p-1 text-center bg-gray-100">
                                <div className="text-base font-black font-mono leading-none">
                                    {stats.ventas_semaforo?.total_ventas ?? stats.cantidad_ventas ?? 0}
                                </div>
                                <div className="text-[8px] font-black uppercase mt-0.5">
                                    {__('Realizadas')}
                                </div>
                            </div>
                            <div className="border-2 border-black p-1 text-center bg-gray-100">
                                <div className="text-base font-black font-mono leading-none">
                                    {stats.ventas_semaforo?.ventas_pagadas ?? 0}
                                </div>
                                <div className="text-[8px] font-black uppercase mt-0.5">
                                    {__('Pagadas')}
                                </div>
                            </div>
                            <div className="border-2 border-black p-1 text-center bg-gray-100">
                                <div className="text-base font-black font-mono leading-none">
                                    {stats.ventas_semaforo?.ventas_pendientes ?? 0}
                                </div>
                                <div className="text-[8px] font-black uppercase mt-0.5">
                                    {__('Pendientes')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLA PRINT */}
                    <table className="w-full text-[10px] text-left border-collapse border border-black mb-4">
                        <thead className="bg-gray-100 font-bold border-b border-black">
                            <tr>
                                <th className="p-1 border border-black">{__('Fecha')}</th>
                                <th className="p-1 border border-black font-mono">{__('Ticket')}</th>
                                <th className="p-1 border border-black">{__('Cliente')}</th>
                                <th className="p-1 border border-black">{__('Vendedor')}</th>
                                <th className="p-1 border border-black text-right">{__('Total Venta')}</th>
                                <th className="p-1 border border-black text-right">{__('Comisión')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!ventas || ventas.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-gray-500 border border-black">
                                        {__('No hay ventas registradas en este período.')}
                                    </td>
                                </tr>
                            ) : (
                                ventas.data.map((v) => {
                                    const itemComision = getSaleCommission(v);

                                    return (
                                        <tr key={`print-v-${v.id}`}>
                                            <td className="p-1 border border-black whitespace-nowrap">
                                                {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-1 border border-black font-mono font-bold">
                                                {v.codigo_ticket}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {v.cliente_nombre || __('Cliente General')}
                                            </td>
                                            <td className="p-1 border border-black">
                                                {v.empleado?.nombre_completo || __('Sin Vendedor')}
                                            </td>
                                            <td className="p-1 border border-black text-right font-mono">
                                                {currencySymbol}{Number(v.total).toFixed(2)}
                                            </td>
                                            <td className="p-1 border border-black text-right font-mono font-bold">
                                                {currencySymbol}{itemComision.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot className="font-bold border-t-2 border-black bg-gray-100">
                            <tr>
                                <td colSpan={4} className="p-1 text-right border border-black uppercase">
                                    {__('TOTALES:')}
                                </td>
                                <td className="p-1 text-right font-mono border border-black">
                                    {currencySymbol}{Number(stats.ventas_semaforo?.total_generado ?? stats.total_ventas_monto ?? 0).toFixed(2)}
                                </td>
                                <td className="p-1 text-right font-mono border border-black">
                                    {currencySymbol}{Number(dynamicTotalComisionesVentas).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* FIRMAS PRINT */}
                    <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
                        <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">
                                {selectedEmpleado?.nombre_completo || __('Firma del Vendedor Responsable')}
                            </div>
                            <div className="text-[10px] text-gray-600">
                                {__('Recibí Conforme / Comisión Liquidada')}
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-black pt-1 font-bold uppercase">
                                {empresa?.razon_social || __('Administración / Área Comercial')}
                            </div>
                            <div className="text-[10px] text-gray-600">
                                {__('Aprobado y Pagado')}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* ── PLANTILLA OFICIAL DE IMPRESIÓN TÉRMICA 80MM (@media print) ────── */}
            {ticketData && isTicketModalOpen && (
                <div id="printable-commission-ticket" className="hidden print:block text-black bg-white font-mono p-4 text-xs w-[80mm] max-w-[80mm] mx-auto">
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            #printable-commission-ticket, #printable-commission-ticket * {
                                visibility: visible !important;
                            }
                            #printable-commission-ticket {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 80mm !important;
                                max-width: 80mm !important;
                                margin: 0 !important;
                                padding: 4mm !important;
                                background: white !important;
                                color: black !important;
                                font-family: monospace, Arial, sans-serif !important;
                                font-size: 11px !important;
                            }
                            @page {
                                size: 80mm auto;
                                margin: 0;
                            }
                        }
                    `}</style>

                    <div className="text-center mb-1">
                        {ticketData.empresa?.logo ? (
                            <img
                                src={ticketData.empresa.logo}
                                alt="Logo"
                                className="h-10 max-w-[160px] mx-auto object-contain mb-1"
                            />
                        ) : (
                            <div className="font-black text-sm uppercase">{ticketData.empresa?.razon_social || 'FixSale POS'}</div>
                        )}
                        <div className="font-bold text-xs uppercase">{ticketData.empresa?.razon_social}</div>
                        {ticketData.empresa?.documento && <div className="text-[10px]">{ticketData.empresa.documento}</div>}
                        {ticketData.sucursal?.nombre && <div className="text-[10px]">{ticketData.sucursal.nombre}</div>}
                    </div>

                    <div className="border-b border-dashed border-black my-1"></div>

                    <div className="text-center font-bold text-xs my-1 uppercase">
                        {__('RECIBO DE PAGO DE COMISIÓN')}
                    </div>
                    <div className="text-center font-bold text-sm">{ticketData.codigo_recibo}</div>
                    <div className="text-center text-[10px]">{ticketData.fecha_pago}</div>

                    <div className="border-b border-dashed border-black my-1"></div>

                    <div className="text-[10px] space-y-0.5">
                        <div><b>{__('EMPLEADO:')}</b> {ticketData.empleado?.nombre_completo}</div>
                        {ticketData.empleado?.documento_numero && (
                            <div><b>{__('DOCUMENTO:')}</b> {ticketData.empleado.documento_numero}</div>
                        )}
                        <div><b>{__('CARGO:')}</b> {ticketData.empleado?.cargo || 'Empleado'}</div>
                    </div>

                    <div className="border-b border-dashed border-black my-1"></div>

                    <div className="text-[10px] font-bold mb-1">{__('PARTIDAS LIQUIDADAS:')}</div>
                    <table className="w-full text-[10px] mb-1">
                        <thead>
                            <tr className="border-b border-dashed border-black">
                                <th className="text-left py-0.5">Item</th>
                                <th className="text-right py-0.5">Base</th>
                                <th className="text-right py-0.5">Comisión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketData.ventas_liquidadas?.map((v) => (
                                <tr key={`pv-${v.id}`}>
                                    <td className="py-0.5">{v.codigo_ticket}</td>
                                    <td className="text-right py-0.5">${Number(v.total).toFixed(2)}</td>
                                    <td className="text-right py-0.5 font-bold">${Number(v.comision_monto).toFixed(2)}</td>
                                </tr>
                            ))}
                            {ticketData.reparaciones_liquidadas?.map((r) => (
                                <tr key={`pr-${r.id}`}>
                                    <td className="py-0.5">{r.numero_orden}</td>
                                    <td className="text-right py-0.5">${Number(r.total).toFixed(2)}</td>
                                    <td className="text-right py-0.5 font-bold">${Number(r.comision_monto).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-b border-dashed border-black my-1"></div>

                    <div className="text-[11px] space-y-0.5 text-right">
                        <div>{__('Total Base:')} ${Number((ticketData.total_ventas_base || 0) + (ticketData.total_reparaciones_base || 0)).toFixed(2)}</div>
                        <div>{__('Método:')} {ticketData.metodo_pago.toUpperCase()}</div>
                        <div className="text-sm font-black pt-1 border-t border-dashed border-black">
                            TOTAL PAGADO: ${Number(ticketData.monto_total).toFixed(2)}
                        </div>
                    </div>

                    <div className="border-b border-dashed border-black my-2"></div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[9px] mt-4">
                        <div>
                            <div className="border-t border-dashed border-black pt-1">
                                {__('Firma Empleado')}
                            </div>
                            <div>{__('Recibí Conforme')}</div>
                        </div>
                        <div>
                            <div className="border-t border-dashed border-black pt-1">
                                {__('Firma y Sello')}
                            </div>
                            <div>{ticketData.cajero?.name || 'Administración'}</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
