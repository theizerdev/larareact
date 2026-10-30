import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Wrench,
    Plus,
    Eye,
    Printer,
    Send,
    Smartphone,
    Calendar,
    Copy,
    RefreshCw,
    QrCode,
    Camera,
    Loader2,
    Tag,
    Search,
    X,
    AlertTriangle,
    Clock,
    UserRound,
} from 'lucide-react';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import EtiquetaTermicaModal from '@/components/reparaciones/EtiquetaTermicaModal';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/searchable-select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { QRCodeSVG } from '@/components/qr-code-svg';
import { BarcodeSVG } from '@/components/barcode-svg';
import type { Paginated } from '@/types/app';

const DOT_COORDS_VIEW: Record<number, { x: number; y: number }> = {
    1: { x: 50, y: 50 },
    2: { x: 150, y: 50 },
    3: { x: 250, y: 50 },
    4: { x: 50, y: 150 },
    5: { x: 150, y: 150 },
    6: { x: 250, y: 150 },
    7: { x: 50, y: 250 },
    8: { x: 150, y: 250 },
    9: { x: 250, y: 250 },
};

function PrintablePatternLock({ pattern = [] }: { pattern: number[] }) {
    if (!pattern || pattern.length === 0) return null;
    return (
        <div className="flex flex-col items-center my-1.5 text-center">
            <div className="text-[9px] font-bold uppercase mb-0.5">GRÁFICA DEL PATRÓN DE DESBLOQUEO</div>
            <svg width="120" height="120" viewBox="0 0 300 300" className="border border-black bg-white mx-auto">
                {pattern.map((dot, idx) => {
                    if (idx === 0) return null;
                    const prevDot = pattern[idx - 1];
                    const from = DOT_COORDS_VIEW[prevDot];
                    const to = DOT_COORDS_VIEW[dot];
                    if (!from || !to) return null;
                    return (
                        <g key={`print-line-${idx}`}>
                            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="black" strokeWidth="10" strokeLinecap="round" />
                        </g>
                    );
                })}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
                    const coord = DOT_COORDS_VIEW[dotNum];
                    const isSelected = pattern.includes(dotNum);
                    const orderIndex = pattern.indexOf(dotNum);
                    return (
                        <g key={`print-dot-${dotNum}`}>
                            <circle cx={coord.x} cy={coord.y} r={isSelected ? 18 : 12} fill={isSelected ? "black" : "white"} stroke="black" strokeWidth="3" />
                            {isSelected && (
                                <text x={coord.x} y={coord.y + 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="monospace">
                                    {orderIndex + 1}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="text-[9px] font-mono font-bold mt-1">Secuencia: {pattern.join(' - ')}</div>
        </div>
    );
}

const extractPatternNumbers = (val: string | null | undefined): number[] => {
    if (!val) return [];
    if (typeof val !== 'string') return [];
    const match = val.match(/(?:Patrón|Secuencia|Pattern)?\s*:?\s*([\d\s\-_,]+)/i);
    const textToScan = match ? match[1] : val;
    const digits = textToScan.match(/\b[1-9]\b/g);
    if (!digits) return [];
    return digits.map(Number);
};

/** Metadatos visuales de cada estado del taller (orden = flujo de trabajo). */
const STATUS_META: Array<{
    value: string;
    num: number;
    label: string;
    aliases: string[];
    delivered?: boolean;
    badge: string;
    dot: string;
}> = [
    { value: 'recibido', num: 1, label: 'RECIBIDO', aliases: [], badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900', dot: 'bg-amber-500' },
    { value: 'en_diagnostico_presupuesto', num: 2, label: 'EN DIAGNOSTICO Y PRESUPUESTO', aliases: ['en_diagnostico'], badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', dot: 'bg-blue-500' },
    { value: 'confirmacion_presupuesto', num: 3, label: 'CONFIRMACION DE PRESUPUESTO', aliases: ['presupuestado'], badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900', dot: 'bg-indigo-500' },
    { value: 'espera_refaccion', num: 4, label: 'ESPERA DE REFACCION', aliases: ['esperando_repuesto'], badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900', dot: 'bg-orange-500' },
    { value: 'en_reparacion', num: 5, label: 'EN REPARACION', aliases: [], badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900', dot: 'bg-purple-500' },
    { value: 'listo_reparado', num: 6, label: 'LISTO PARA ENTREGAR REPARADO', aliases: ['reparado'], badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900', dot: 'bg-emerald-500' },
    { value: 'listo_sin_solucion', num: 7, label: 'LISTO PARA ENTREGAR SIN SOLUCION', aliases: ['cancelado'], badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900', dot: 'bg-rose-500' },
    { value: 'entregado_reparado', num: 8, label: 'ENTREGADO REPARADO', aliases: ['entregado_finalizado', 'entregado'], delivered: true, badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-600 dark:bg-emerald-400' },
    { value: 'entregado_no_reparado', num: 9, label: 'ENTREGADO NO REPARADO', aliases: [], delivered: true, badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', dot: 'bg-rose-600 dark:bg-rose-400' },
    { value: 'reincidencia_garantia', num: 10, label: 'REINCIDENCIA/GARANTIA', aliases: ['reincidencia'], badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900', dot: 'bg-pink-500' },
];

const findStatusMeta = (st?: string | null) =>
    STATUS_META.find((s) => s.value === st || s.aliases.includes(String(st)));

const isDeliveredStatus = (st?: string | null) => Boolean(findStatusMeta(st)?.delivered);

/** Días calendario entre hoy y la fecha dada (positivo = en el pasado). */
const daysSince = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const clean = String(dateStr).split('T')[0].split(' ')[0];
    const [y, m, d] = clean.split('-').map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((today.getTime() - date.getTime()) / 86400000);
};

interface Orden {
    id: number;
    numero_orden: string;
    cliente_id?: number;
    cliente_nombre: string;
    cliente_telefono?: string;
    tipo_dispositivo: string;
    marca_nombre: string;
    modelo_nombre: string;
    color?: string;
    imei_serie?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    accesorios_incluidos?: string;
    contrasena_patron?: string;
    estado_orden: string;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    fecha_recepcion: string;
    fecha_estimada_entrega?: string;
    fecha_prometida?: string;
    fecha_entrega?: string | null;
    created_at?: string;
    tecnico?: { id?: number; name: string } | null;
    cliente?: { nombre: string; telefono?: string };
    marca?: { nombre: string };
    modelo?: { nombre_comercial: string; codigo_modelo?: string };
    items?: Array<{ id: number; descripcion?: string; precio: number; cantidad: number; servicio?: { nombre: string }; producto?: { nombre: string } }>;
    empresa_id?: number;
    empresa?: any;
    sucursal?: any;
    garantia_dias?: number;
}

interface Props {
    ordenes: Paginated<Orden>;
    counts: Record<string, number>;
    summary?: { activas: number; entregadas: number; todas: number };
    searchAllStates?: boolean;
    tecnicos: { id: number; name: string }[];
    marcas?: Array<{ id: number; nombre: string; modelos?: any[] }>;
    modelos?: Array<{ id: number; marca_id?: number; categoria_id?: number; nombre_comercial: string; codigo_modelo?: string }>;
    categorias?: Array<{ id: number; nombre: string }>;
    currencySymbol: string;
    availableYears?: string[];
    sucursales?: Array<{ id: number; nombre: string }>;
    currentSucursalId?: string | number | null;
    filters: {
        search?: string;
        status?: string;
        tecnico_id?: string;
        year?: string;
        month?: string;
        perPage?: string;
        sucursal_id?: string;
        from?: string;
        to?: string;
        sortBy?: string;
        sortDir?: string;
    };
    isTecnicoOnly?: boolean;
    empresa?: any;
}

export default function IndexReparaciones({
    ordenes,
    counts,
    summary,
    searchAllStates = false,
    tecnicos,
    marcas = [],
    modelos = [],
    categorias = [],
    currencySymbol,
    availableYears = [],
    filters,
    isTecnicoOnly,
    empresa,
    sucursales = [],
    currentSucursalId,
}: Props) {
    const { __ } = useTranslate();
    const pageUser = usePage<any>().props.auth?.user;
    const empresaInfo = empresa || pageUser?.empresa;
    const isUserTecnico = isTecnicoOnly || Boolean(pageUser?.roles?.some((r: any) => String(r.name).toLowerCase().includes('tecnic'))) || pageUser?.tipo_usuario === 'tecnico';

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [year, setYear] = useState(filters.year || 'all');
    const [month, setMonth] = useState(filters.month || 'all');
    const [tecnicoId, setTecnicoId] = useState(filters.tecnico_id || 'all');
    const [sucursalId, setSucursalId] = useState(
        filters.sucursal_id ? String(filters.sucursal_id) : (currentSucursalId ? String(currentSucursalId) : 'all')
    );
    const [perPage, setPerPage] = useState(filters.perPage ? String(filters.perPage) : '10');

    // Quick Print Ticket State
    const [printOrden, setPrintOrden] = useState<Orden | null>(null);
    const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
    const [selectedStickerOrden, setSelectedStickerOrden] = useState<Orden | null>(null);

    // Select2 Options (memoized)
    const totals = useMemo(() => {
        const sum = (keys: string[]) => keys.reduce((acc, k) => acc + (counts?.[k] ?? 0), 0);
        const entregadas = summary?.entregadas ?? sum(STATUS_META.filter((s) => s.delivered).map((s) => s.value));
        const todas = summary?.todas ?? sum(STATUS_META.map((s) => s.value));
        return {
            activas: summary?.activas ?? todas - entregadas,
            entregadas,
            todas,
        };
    }, [counts, summary]);

    // Pestañas de taller activas tal como en la imagen
    const workshopTabs = useMemo(() => [
        { value: 'recibido', label: __('RECIBIDO'), count: counts?.['recibido'] ?? 0 },
        { value: 'en_diagnostico_presupuesto', label: __('EN DIAGNOSTICO Y PRESUPUESTO'), count: counts?.['en_diagnostico_presupuesto'] ?? 0 },
        { value: 'confirmacion_presupuesto', label: __('CONFIRMACION DE PRESUPUESTO'), count: counts?.['confirmacion_presupuesto'] ?? 0 },
        { value: 'espera_refaccion', label: __('ESPERA DE REFACCION'), count: counts?.['espera_refaccion'] ?? 0 },
        { value: 'en_reparacion', label: __('EN REPARACION'), count: counts?.['en_reparacion'] ?? 0 },
        { value: 'listo_reparado', label: __('LISTO PARA ENTREGAR REPARADO'), count: counts?.['listo_reparado'] ?? 0 },
        { value: 'listo_sin_solucion', label: __('LISTO PARA ENTREGAR SIN SOLUCION'), count: counts?.['listo_sin_solucion'] ?? 0 },
        { value: 'reincidencia_garantia', label: __('REINCIDENCIA/GARANTIA'), count: counts?.['reincidencia_garantia'] ?? 0 },
    ], [counts, __]);

    const totalWorkshopCount = useMemo(() => {
        return workshopTabs.reduce((acc, tab) => acc + tab.count, 0);
    }, [workshopTabs]);

    const statusOptions = useMemo(() => [
        { value: 'all', label: `${__('Todos los estados')} (${totals.activas})` },
        ...STATUS_META.map((s) => ({
            value: s.value,
            label: `${s.num}-${s.label} (${counts?.[s.value] ?? 0})`,
        })),
        { value: 'entregados', label: `${__('Todas las entregadas')} (${totals.entregadas})` },
        { value: 'todas', label: `${__('Historial completo')} (${totals.todas})` },
    ], [counts, totals, __]);

    const yearOptions = useMemo(() => {
        const currentY = String(new Date().getFullYear());
        const list = availableYears && availableYears.length > 0 ? availableYears : [currentY];
        return [
            { value: 'all', label: __('Todos los años') },
            ...list.map((y) => ({ value: String(y), label: String(y) })),
        ];
    }, [availableYears, __]);

    const monthOptions = useMemo(() => [
        { value: 'all', label: __('Todos los meses') },
        { value: '1', label: __('Enero') },
        { value: '2', label: __('Febrero') },
        { value: '3', label: __('Marzo') },
        { value: '4', label: __('Abril') },
        { value: '5', label: __('Mayo') },
        { value: '6', label: __('Junio') },
        { value: '7', label: __('Julio') },
        { value: '8', label: __('Agosto') },
        { value: '9', label: __('Septiembre') },
        { value: '10', label: __('Octubre') },
        { value: '11', label: __('Noviembre') },
        { value: '12', label: __('Diciembre') },
    ], [__]);

    const tecnicoOptions = useMemo(() => [
        { value: 'all', label: __('Todos los técnicos') },
        { value: 'unassigned', label: __('Sin técnico asignado') },
        ...(tecnicos || []).map((t) => ({
            value: String(t.id),
            label: t.name,
        })),
    ], [tecnicos, __]);

    const sucursalOptions = useMemo(() => [
        { value: 'all', label: __('Todas las sucursales') },
        ...(sucursales || []).map((s) => ({
            value: String(s.id),
            label: s.nombre,
        })),
    ], [sucursales, __]);

    const perPageOptions = [
        { value: '10', label: '10' },
        { value: '25', label: '25' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ];

    // Global hardware barcode scanner detector
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInsideInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length >= 3) {
                    const cleaned = buffer.replace(/REP['´`]/gi, 'REP-').replace(/['´`]/g, '-').trim();
                    if (/REP-\d+/i.test(cleaned) || /^[A-Z0-9\-_]{4,}$/i.test(cleaned)) {
                        if (!isInsideInput) {
                            e.preventDefault();
                        }
                        setSearch(cleaned);
                    }
                }
                buffer = '';
                return;
            }

            if (timeDiff > 80) {
                buffer = '';
            }

            if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Auto debounce filters
    const isInitialMount = useRef(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const resetSortRef = useRef(false);

    const visitWithFilters = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        const keepSort = !resetSortRef.current && Boolean(filters.sortBy);
        resetSortRef.current = false;
        router.get(
            '/admin/reparaciones',
            cleanParams({
                search: search.trim() || undefined,
                status: status === 'all' ? undefined : status,
                year: year !== 'all' ? year : undefined,
                month: month !== 'all' ? month : undefined,
                tecnico_id: tecnicoId === 'all' ? undefined : tecnicoId,
                sucursal_id: sucursalId || undefined,
                perPage: perPage === '10' ? undefined : perPage,
                sortBy: keepSort ? filters.sortBy : undefined,
                sortDir: keepSort ? filters.sortDir : undefined,
            }),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsFetching(true),
                onFinish: () => setIsFetching(false),
            }
        );
    };

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        debounceRef.current = setTimeout(visitWithFilters, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, year, month, tecnicoId, sucursalId, perPage]);

    // QR Code Camera Scanner States
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [scannedOrden, setScannedOrden] = useState<any | null>(null);
    const [isSearchingOrden, setIsSearchingOrden] = useState(false);
    const [isStartingReparacion, setIsStartingReparacion] = useState(false);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<any>(null);

    const loadHtml5QrcodePlugin = (): Promise<any> => {
        return new Promise((resolve) => {
            if ((window as any).Html5Qrcode) {
                resolve((window as any).Html5Qrcode);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.async = true;
            script.onload = () => resolve((window as any).Html5Qrcode);
            script.onerror = () => resolve(null);
            document.body.appendChild(script);
        });
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (e) { }
            html5QrCodeRef.current = null;
        }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        setCameraError(null);
        setIsCameraActive(true);
        try {
            const Html5Qrcode = await loadHtml5QrcodePlugin();
            if (!Html5Qrcode) {
                setCameraError(__('No se pudo cargar el plugin de escaneo QR. Usar la búsqueda manual.'));
                setIsCameraActive(false);
                return;
            }

            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                } catch (e) { }
            }

            setTimeout(async () => {
                try {
                    const container = document.getElementById('qr-reader-container');
                    if (!container) return;

                    const scanner = new Html5Qrcode('qr-reader-container');
                    html5QrCodeRef.current = scanner;

                    await scanner.start(
                        { facingMode: 'environment' },
                        {
                            fps: 15,
                            qrbox: (w: number, h: number) => {
                                const min = Math.min(w, h);
                                return { width: Math.floor(min * 0.85), height: Math.floor(min * 0.85) };
                            },
                        },
                        (decodedText: string) => {
                            if (decodedText) {
                                handleSearchByCode(decodedText);
                                stopCamera();
                            }
                        },
                        () => { }
                    );
                } catch (err: any) {
                    setCameraError(__('No se pudo iniciar la cámara. Verifique los permisos en su navegador.'));
                    setIsCameraActive(false);
                }
            }, 300);
        } catch (e: any) {
            setCameraError(__('Error al acceder a la cámara.'));
            setIsCameraActive(false);
        }
    };

    const handleSearchByCode = async (code: string) => {
        if (!code.trim()) return;
        setIsSearchingOrden(true);
        setScannedOrden(null);

        let cleanCode = code.trim().replace(/REP['´`]/gi, 'REP-').replace(/['´`]/g, '-');
        const urlMatch = cleanCode.match(/reparaciones\/(\d+)/i);
        if (urlMatch) {
            cleanCode = urlMatch[1];
        }

        try {
            const res = await fetch(`/admin/reparaciones/api-find?code=${encodeURIComponent(cleanCode)}`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            if (json.found && json.orden) {
                setScannedOrden(json.orden);
                notifySuccess(__('Orden de reparación localizada con éxito.'));
            } else {
                notifyError(__('No se encontró ninguna orden con el código ingresado.'));
            }
        } catch {
            notifyError(__('Error al consultar el servidor.'));
        } finally {
            setIsSearchingOrden(false);
        }
    };

    const handleStartReparacion = () => {
        if (!scannedOrden) return;
        setIsStartingReparacion(true);
        router.post(
            `/admin/reparaciones/${scannedOrden.id}/update-estado`,
            {
                estado_orden: 'en_reparacion',
                nota_cambio: __('Inicio de trabajo por escaneo rápido de QR'),
            },
            {
                onSuccess: () => {
                    setIsStartingReparacion(false);
                    setScannedOrden((prev: any) => (prev ? { ...prev, estado_orden: 'en_reparacion' } : null));
                    notifySuccess(__('Proceso de reparación iniciado correctamente. El equipo se encuentra En Reparación.'));
                },
                onError: () => {
                    setIsStartingReparacion(false);
                    notifyError(__('Ocurrió un error al iniciar la reparación.'));
                },
            }
        );
    };

    useEffect(() => {
        if (!isScanModalOpen) {
            stopCamera();
            setScannedOrden(null);
            setScanInput('');
        }
        return () => {
            stopCamera();
        };
    }, [isScanModalOpen]);

    const formatNum = (val: any): string => {
        if (val === null || val === undefined || val === '') return '0.00';
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';
        try {
            const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr || '';
        }
    };

    const formatFullSpanishDate = (dateStr?: string): string => {
        if (!dateStr) return __('No especificada');
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                const d = new Date(year, month - 1, day);
                const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
                const monthName = d.toLocaleDateString('es-ES', { month: 'long' });
                const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                return `${capDay} ${day} de ${capMonth} de ${year}`;
            }
            return dateStr;
        } catch {
            return dateStr || __('No especificada');
        }
    };

    const handleQuickPrintTicket = (o: Orden) => {
        setPrintOrden(o);
        setTimeout(() => {
            window.print();
        }, 120);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notifySuccess(__('Folio copiado al portapapeles.'));
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (status && status !== 'all') count++;
        if (tecnicoId && tecnicoId !== 'all') count++;
        if (year && year !== 'all') count++;
        if (month && month !== 'all') count++;
        return count;
    }, [search, status, tecnicoId, year, month]);

    const hasActiveFilters = activeFilterCount > 0 || perPage !== '10' || Boolean(filters.sortBy);

    // La sucursal se conserva al limpiar (es el contexto de trabajo, no un filtro de búsqueda)
    const handleResetFilters = () => {
        const changed = search !== '' || status !== 'all' || year !== 'all' || month !== 'all' || tecnicoId !== 'all' || perPage !== '10';
        resetSortRef.current = true;
        setSearch('');
        setStatus('all');
        setYear('all');
        setMonth('all');
        setTecnicoId('all');
        setPerPage('10');
        // Si ningún estado cambió (p. ej. solo había orden activo), el efecto no se dispara: navegar ahora
        if (!changed) visitWithFilters();
    };

    const sendWhatsApp = (o: Orden) => {
        const phone = o.cliente?.telefono || o.cliente_telefono;
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const clientName = o.cliente?.nombre || o.cliente_nombre || 'Estimado(a) Cliente';
        const brandName = o.marca?.nombre || o.marca_nombre || '';
        const modelName = o.modelo?.nombre_comercial || o.modelo_nombre || '';
        const deviceName = `${brandName} ${modelName}`.trim() || 'Equipo';
        const empresaId = o.empresa_id || o.empresa?.id || empresaInfo?.id || 1;
        const empName = empresaInfo?.razon_social || empresaInfo?.nombre || empresaInfo?.nombre_comercial || 'FixSale';
        const trackingUrl = `${window.location.origin}/reparacion/${empresaId}/consultar?orden=${o.numero_orden}`;
        const falla = o.descripcion_falla || 'Revisión técnica general';
        const costoEstimado = formatNum(o.costo_estimado);
        const anticipo = formatNum(o.anticipo);
        const saldo = formatNum(o.saldo_restante);
        const garantia = o.garantia_dias || 30;
        const fecha = o.fecha_recepcion ? new Date(o.fecha_recepcion).toLocaleDateString('es-ES') : 'hoy';

        let text = '';
        switch (o.estado_orden) {
            case 'recibido':
                text = `👋 Hola *${clientName}*, le saludamos de *${empName}*.\n\n📱 Hemos recibido su equipo *${deviceName}* (Orden *${o.numero_orden}*).\n*Falla reportada:* ${falla}\n*Fecha de ingreso:* ${fecha}\n\nNuestro equipo técnico iniciará la revisión y diagnóstico a la brevedad.\n\n🔎 Consulte el avance en vivo aquí:\n${trackingUrl}`;
                break;
            case 'en_diagnostico_presupuesto':
            case 'en_diagnostico':
                text = `🔍 Hola *${clientName}*, su equipo *${deviceName}* (Orden *${o.numero_orden}*) se encuentra en fase de *DIAGNÓSTICO TÉCNICO Y PRESUPUESTO*.\n\n🛠️ Estamos evaluando componentes y costos para brindarle una cotización transparente.\n\n🔎 Seguimiento en vivo:\n${trackingUrl}`;
                break;
            case 'confirmacion_presupuesto':
            case 'presupuestado':
                text = `💵 Hola *${clientName}*, tenemos listo el presupuesto para su equipo *${deviceName}* (Orden *${o.numero_orden}*).\n\n💰 *Presupuesto Total:* *${currencySymbol}${costoEstimado}*\n💳 *Anticipo abonado:* *${currencySymbol}${anticipo}*\n🏷️ *Saldo pendiente:* *${currencySymbol}${saldo}*\n\nPor favor revise y apruebe o rechace su presupuesto directamente en nuestro portal web:\n👉 ${trackingUrl}\n\nO responda a este mensaje para confirmar y proceder con la reparación.`;
                break;
            case 'espera_refaccion':
            case 'esperando_repuesto':
                text = `📦 Hola *${clientName}*, le informamos sobre su orden *${o.numero_orden}* (*${deviceName}*):\n\nEl equipo se encuentra en *ESPERA DE REFACCIONES / REPUESTOS* para garantizar una reparación con repuestos de óptima calidad.\n\nEn cuanto recibamos las piezas continuaremos con la intervención técnica.\n🔎 Consulte el estado en vivo: ${trackingUrl}`;
                break;
            case 'en_reparacion':
                text = `🛠️ Hola *${clientName}*, le informamos que su equipo *${deviceName}* (Orden *${o.numero_orden}*) está *EN PROCESO DE REPARACIÓN ACTIVA* en nuestro laboratorio técnico.\n\nLe avisaremos apenas concluyan las pruebas de control de calidad.\n🔎 Seguimiento: ${trackingUrl}`;
                break;
            case 'listo_reparado':
            case 'reparado':
                text = `🟢 ¡Buenas noticias *${clientName}*! Su equipo *${deviceName}* (Orden *${o.numero_orden}*) ha sido *REPARADO EXITOSAMENTE* y superó las pruebas de calidad.\n\n🎉 Ya puede pasar a retirarlo por nuestra sucursal.\n💰 *Saldo a liquidar:* *${currencySymbol}${saldo}*\n🛡️ *Garantía del servicio:* ${garantia} días\n\n📌 Detalles y ubicación: ${trackingUrl}\n¡Le esperamos!`;
                break;
            case 'listo_sin_solucion':
            case 'cancelado':
                text = `📋 Hola *${clientName}*, le informamos que su equipo *${deviceName}* (Orden *${o.numero_orden}*) se encuentra disponible para retiro en sucursal como *SIN SOLUCIÓN / CANCELADO*.\n\n🏢 Puede pasar a retirarlo en nuestro horario habitual.\n💰 *Saldo pendiente:* *${currencySymbol}${saldo}*\n\n📌 Detalles de su orden: ${trackingUrl}`;
                break;
            case 'entregado_reparado':
            case 'entregado_finalizado':
            case 'entregado':
                text = `✅ ¡Gracias por su preferencia *${clientName}*! Su orden *${o.numero_orden}* (*${deviceName}*) ha sido *ENTREGADA REPARADA* con éxito.\n\n🛡️ Su servicio cuenta con *${garantia} días de garantía*.\n\n📄 Puede consultar o descargar su comprobante aquí:\n${trackingUrl}\n\n¡Gracias por confiar en *${empName}*!`;
                break;
            case 'entregado_no_reparado':
                text = `📋 Hola *${clientName}*, le confirmamos la entrega de su equipo *${deviceName}* (Orden *${o.numero_orden}*) con estatus *ENTREGADO NO REPARADO (SIN SOLUCIÓN)*.\n\nLamentamos no haber podido darle solución en esta ocasión. Agradecemos su confianza.\n\n📄 Detalles de su orden: ${trackingUrl}`;
                break;
            case 'reincidencia_garantia':
            case 'reincidencia':
                text = `🔄 Hola *${clientName}*, hemos recibido su equipo *${deviceName}* (Orden *${o.numero_orden}*) por concepto de *REINCIDENCIA / APLICACIÓN DE GARANTÍA*.\n\nNuestro equipo técnico dará prioridad a la revisión de su caso para brindarle una solución oportuna.\n\n🔎 Consulte el estado en vivo: ${trackingUrl}`;
                break;
            default:
                text = `Hola *${clientName}*, le saludamos de *${empName}* respecto a su orden *${o.numero_orden}* (${deviceName}).\n\nEstado actual: *${o.estado_orden.toUpperCase().replace(/_/g, ' ')}*.\nSeguimiento: ${trackingUrl}`;
                break;
        }

        router.post(
            `/admin/reparaciones/${o.id}/notificar-whatsapp`,
            {
                mensaje: text,
                telefono: phone,
                estado: o.estado_orden,
            },
            {
                onSuccess: () => notifySuccess(__('Notificación enviada exitosamente al cliente.')),
                onError: (err: any) => notifyError(err?.message || __('Error al enviar notificación.')),
            }
        );
    };

    const getStatusBadge = (st: string) => {
        const meta = findStatusMeta(st);
        if (!meta) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {st?.replace(/_/g, ' ').toUpperCase() || '—'}
                </span>
            );
        }
        return (
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap', meta.badge)}>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', meta.dot)}></span>
                {meta.num}-{meta.label}
            </span>
        );
    };

    /** Indicador de antigüedad / vencimiento de la orden. */
    const getTimingInfo = (o: Orden) => {
        if (isDeliveredStatus(o.estado_orden)) {
            return o.fecha_entrega
                ? { tone: 'muted' as const, text: `${__('Entregado')} ${formatDate(o.fecha_entrega)}` }
                : null;
        }
        const overdueDays = daysSince(o.fecha_prometida);
        if (overdueDays !== null && overdueDays > 0) {
            return { tone: 'danger' as const, text: overdueDays === 1 ? __('Vencida hace 1 día') : `${__('Vencida hace')} ${overdueDays} ${__('días')}` };
        }
        if (overdueDays === 0) {
            return { tone: 'warning' as const, text: __('Se entrega hoy') };
        }
        const age = daysSince(o.fecha_recepcion || o.created_at);
        if (age === null) return null;
        const text = age === 0 ? __('Ingresó hoy') : age === 1 ? __('1 día en taller') : `${age} ${__('días en taller')}`;
        return { tone: age >= 15 ? ('warning' as const) : ('muted' as const), text };
    };

    const isOverdue = (o: Orden) => {
        if (isDeliveredStatus(o.estado_orden)) return false;
        const d = daysSince(o.fecha_prometida);
        return d !== null && d > 0;
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
    ];

    const columns: ColumnDef<Orden>[] = [
        {
            header: __('Folio / Fecha'),
            dropdownLabel: __('Folio / Fecha'),
            accessorKey: 'numero_orden',
            sortable: true,
            hideable: false,
            cell: (o) => {
                const timing = getTimingInfo(o);
                return (
                    <div className="flex flex-col gap-1 min-w-[130px]">
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                {o.numero_orden}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(o.numero_orden);
                                }}
                                className="text-slate-400 hover:text-purple-600 transition-colors"
                                title={__('Copiar Folio')}
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(o.fecha_recepcion || o.created_at)}</span>
                        </div>
                        {timing && (
                            <span
                                className={cn(
                                    'inline-flex w-fit items-center gap-1 text-[10px] font-semibold rounded px-1.5 py-0.5',
                                    timing.tone === 'danger' && 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
                                    timing.tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                    timing.tone === 'muted' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                )}
                            >
                                {timing.tone === 'danger' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {timing.text}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: __('Cliente'),
            dropdownLabel: __('Cliente'),
            accessorKey: 'cliente_nombre',
            sortable: true,
            cell: (o) => (
                <div className="flex flex-col min-w-[140px]">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">
                        {o.cliente?.nombre || o.cliente_nombre || __('Cliente General')}
                    </span>
                    {(o.cliente?.telefono || o.cliente_telefono) && (
                        <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                            {o.cliente?.telefono || o.cliente_telefono}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: __('Equipo / Falla'),
            dropdownLabel: __('Equipo / Falla'),
            accessorKey: 'modelo_nombre',
            cell: (o) => (
                <div className="flex flex-col gap-0.5 min-w-[170px] max-w-[260px]">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                            {o.marca?.nombre || o.marca_nombre} {o.modelo?.nombre_comercial || o.modelo_nombre}
                        </span>
                        {o.color && <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 shrink-0">· {o.color}</span>}
                    </div>
                    {o.imei_serie && (
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            IMEI: {o.imei_serie}
                        </span>
                    )}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate" title={o.descripcion_falla}>
                        {o.descripcion_falla || __('Sin detalle especificado')}
                    </p>
                </div>
            ),
        },
        ...(!isTecnicoOnly
            ? [
                  {
                      header: __('Técnico'),
                      dropdownLabel: __('Técnico'),
                      hideOn: 'tablet' as const,
                      cell: (o: Orden) =>
                          o.tecnico?.name ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  <UserRound className="w-3.5 h-3.5 text-slate-400" />
                                  {o.tecnico.name}
                              </span>
                          ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
                                  {__('Sin asignar')}
                              </span>
                          ),
                  } as ColumnDef<Orden>,
              ]
            : []),
        {
            header: __('Estado'),
            dropdownLabel: __('Estado'),
            accessorKey: 'estado_orden',
            sortable: true,
            className: 'text-center',
            cell: (o) => getStatusBadge(o.estado_orden),
        },
        {
            header: __('Importe'),
            dropdownLabel: __('Importe'),
            accessorKey: 'saldo_restante',
            sortable: true,
            className: 'text-right',
            cell: (o) => {
                const saldo = parseFloat(String(o.saldo_restante ?? 0)) || 0;
                const anticipo = parseFloat(String(o.anticipo ?? 0)) || 0;
                return (
                    <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            {__('Total')}: <span className="font-bold text-slate-800 dark:text-slate-200">{currencySymbol}{formatNum(o.costo_estimado)}</span>
                        </span>
                        {anticipo > 0 && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                {__('Anticipo')}: {currencySymbol}{formatNum(o.anticipo)}
                            </span>
                        )}
                        {saldo > 0 ? (
                            <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400" title={__('Saldo a Cobrar')}>
                                {currencySymbol}{formatNum(o.saldo_restante)}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {__('Sin saldo')}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: __('Acciones'),
            className: 'text-center',
            hideable: false,
            stopRowClick: true,
            cell: (o) => (
                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.visit(`/admin/reparaciones/${o.id}`);
                        }}
                        className="h-8 px-2.5 text-xs font-bold gap-1 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950/40"
                        title={__('Ver ficha de la orden')}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{__('Ficha')}</span>
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleQuickPrintTicket(o);
                        }}
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        title={__('Imprimir Ticket de Cliente')}
                    >
                        <Printer className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStickerOrden(o);
                            setIsStickerModalOpen(true);
                        }}
                        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                        title={__('Imprimir Etiqueta Adhesiva / Sticker')}
                    >
                        <Tag className="w-3.5 h-3.5" />
                    </Button>

                    {(o.cliente?.telefono || o.cliente_telefono) && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsApp(o);
                            }}
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            title={__('Enviar WhatsApp')}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title={__('Servicio Técnico & Reparaciones')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ENCABEZADO ESTÁNDAR DEL MÓDULO */}
                <ModuleHeader
                    icon={<Wrench className="h-6 w-6 text-white" />}
                    title={isTecnicoOnly ? __('Mis Órdenes de Reparación') : __('Taller & Servicio Técnico')}
                    description={__('Recepción de equipos, estado de taller, trazabilidad de repuestos y notificaciones vía WhatsApp.')}
                    colorClassName="bg-purple-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsScanModalOpen(true);
                                startCamera();
                            }}
                            className="gap-2 font-bold border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        >
                            <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="hidden sm:inline">{__('Escanear QR')}</span>
                            <span className="sm:hidden">{__('QR')}</span>
                        </Button>

                        <Link href="/admin/reparaciones/create">
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
                                <Plus className="h-4 w-4" />
                                <span>{__('Nueva Recepción')}</span>
                            </Button>
                        </Link>
                    </div>
                </ModuleHeader>

                {/* TABS / CHIPS RÁPIDOS CON CONTEOS POR ESTADO DE TALLER (TAL COMO EN LA IMAGEN) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setStatus('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shrink-0 cursor-pointer select-none",
                            status === 'all'
                                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                        )}
                    >
                        <span>{__('Todos')}</span>
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                            status === 'all' ? "bg-purple-700/80 text-white" : "bg-muted text-foreground"
                        )}>
                            {totalWorkshopCount}
                        </span>
                    </button>

                    {workshopTabs
                        .filter((tab) => tab.count > 0 || status === tab.value)
                        .map((tab) => {
                            const isSelected = status === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setStatus(isSelected ? 'all' : tab.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shrink-0 select-none cursor-pointer",
                                        isSelected
                                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                            : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                                    )}
                                >
                                    <span>{tab.label}</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                                        isSelected ? "bg-purple-700/80 text-white" : "bg-muted text-foreground"
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                </div>

                {/* AVISO INFORMATIVO AL BUSCAR CON FILTRO POR DEFECTO */}
                {search && (
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Search className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
                            {__('Buscando en todos los estados (incluyendo reparaciones entregadas y finalizadas).')}
                        </span>
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-[11px] underline font-semibold text-purple-700 hover:text-purple-900 dark:text-purple-300 dark:hover:text-purple-100 cursor-pointer"
                        >
                            {__('Limpiar búsqueda')}
                        </button>
                    </div>
                )}

                {/* BARRA DE FILTROS PROFESIONAL Y ALINEADA */}
                <FilterBar className="bg-card text-card-foreground shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-wrap items-end gap-3 w-full">
                        {/* BUSCAR */}
                        <FilterField label={__('Buscar')} className="flex-1 min-w-[220px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                <Input
                                    placeholder={__('Folio (ej. REP-0001, 12), Cliente, IMEI, Modelo...')}
                                    value={search}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const normalized = val.replace(/REP['´`]/gi, 'REP-');
                                        setSearch(normalized);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            visitWithFilters();
                                        }
                                    }}
                                    className="pl-9 pr-8 h-9 text-xs"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        title={__('Borrar búsqueda')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </FilterField>

                        {/* SUCURSAL */}
                        {sucursales && sucursales.length > 0 && (
                            <FilterField label={__('Sucursal')} className="w-full sm:w-36 lg:w-40 shrink-0">
                                <SearchableSelect
                                    options={sucursalOptions}
                                    value={sucursalId}
                                    onChange={setSucursalId}
                                    placeholder={__('Todas')}
                                    searchPlaceholder={__('Buscar sucursal...')}
                                />
                            </FilterField>
                        )}

                        {/* ESTADO */}
                        <FilterField label={__('Estado')} className="w-full sm:w-44 lg:w-52 shrink-0">
                            <SearchableSelect
                                options={statusOptions}
                                value={status}
                                onChange={setStatus}
                                placeholder={__('Todos los estados')}
                                searchPlaceholder={__('Buscar estado...')}
                            />
                        </FilterField>

                        {/* TÉCNICO ASIGNADO */}
                        <FilterField label={__('Técnico Asignado')} className="w-full sm:w-40 lg:w-44 shrink-0">
                            <SearchableSelect
                                options={tecnicoOptions}
                                value={tecnicoId}
                                onChange={setTecnicoId}
                                placeholder={__('Todos los técnicos')}
                                searchPlaceholder={__('Buscar técnico...')}
                                disabled={isTecnicoOnly}
                            />
                        </FilterField>

                        {/* AÑO */}
                        <FilterField label={__('Año')} className="w-24 sm:w-28 shrink-0">
                            <SearchableSelect
                                options={yearOptions}
                                value={year}
                                onChange={setYear}
                                placeholder={__('Todos')}
                                searchPlaceholder={__('Año...')}
                            />
                        </FilterField>

                        {/* MES */}
                        <FilterField label={__('Mes')} className="w-28 sm:w-32 shrink-0">
                            <SearchableSelect
                                options={monthOptions}
                                value={month}
                                onChange={setMonth}
                                placeholder={__('Todos')}
                                searchPlaceholder={__('Mes...')}
                            />
                        </FilterField>

                        {/* MOSTRAR */}
                        <FilterField label={__('Mostrar')} className="w-20 sm:w-24 shrink-0">
                            <SearchableSelect
                                options={perPageOptions}
                                value={perPage}
                                onChange={setPerPage}
                                placeholder="10"
                                searchPlaceholder={__('Cantidad...')}
                            />
                        </FilterField>

                        {/* BOTÓN LIMPIAR FILTROS */}
                        {hasActiveFilters && (
                            <div className="shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-9 px-3 gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                                    title={__('Restablecer todos los filtros')}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>{__('Limpiar Filtros')}</span>
                                    {activeFilterCount > 0 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 font-bold ml-0.5">
                                            {activeFilterCount}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </FilterBar>

                {/* TABLA DE DATOS ESTÁNDAR DATA-TABLE */}
                <DataTable
                    columns={columns}
                    data={ordenes}
                    filters={filters}
                    isLoading={isFetching}
                    rowClassName={(row) => (isOverdue(row) ? 'bg-rose-50/40 dark:bg-rose-950/20' : '')}
                    onRowClick={(row) => router.visit(`/admin/reparaciones/${row.id}`)}
                    emptyState={{
                        title: search ? __('No se encontró la orden') : __('No se encontraron órdenes de reparación'),
                        description: search
                            ? __('No hay resultados para la búsqueda ingresada. Puedes buscar por folio (ej. REP-000001 o 1), cliente, teléfono o IMEI.')
                            : __('Intenta modificar los filtros de búsqueda o registra una nueva orden de servicio.'),
                        icon: <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
                        ctaLabel: search ? __('Limpiar búsqueda') : __('Nueva Recepción'),
                        onCtaClick: () => (search ? setSearch('') : router.visit('/admin/reparaciones/create')),
                    }}
                />

                {/* MODAL ESCANEO DE CÓDIGO QR */}
                <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <QrCode className="w-5 h-5 text-purple-600" />
                                {__('Escanear QR de Orden de Reparación')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 pt-2">
                            {/* CÁMARA */}
                            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
                                <div id="qr-reader-container" className="w-full h-full min-h-[260px]"></div>

                                {cameraError && (
                                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
                                        <Camera className="w-8 h-8 text-rose-500 mb-2" />
                                        <p className="text-xs text-rose-300 font-semibold">{cameraError}</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={startCamera}
                                            className="mt-3 text-xs border-slate-700 text-white"
                                        >
                                            {__('Reintentar')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* BÚSQUEDA MANUAL */}
                            <div className="flex gap-2">
                                <Input
                                    value={scanInput}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const normalized = val.replace(/REP['´`]/gi, 'REP-');
                                        setScanInput(normalized);
                                    }}
                                    placeholder={__('O ingrese folio / código de orden...')}
                                    className="text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByCode(scanInput)}
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleSearchByCode(scanInput)}
                                    disabled={isSearchingOrden || !scanInput.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4"
                                >
                                    {isSearchingOrden ? <Loader2 className="w-4 h-4 animate-spin" /> : __('Buscar')}
                                </Button>
                            </div>

                            {/* RESULTADO ESCANEADO */}
                            {scannedOrden && (
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                                            {scannedOrden.numero_orden}
                                        </span>
                                        {getStatusBadge(scannedOrden.estado_orden)}
                                    </div>

                                    <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                                        <div><strong>{__('Cliente')}:</strong> {scannedOrden.cliente_nombre}</div>
                                        <div><strong>{__('Equipo')}:</strong> {scannedOrden.marca_nombre} {scannedOrden.modelo_nombre}</div>
                                        <div><strong>{__('Falla')}:</strong> {scannedOrden.descripcion_falla}</div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between gap-2">
                                        {isUserTecnico && scannedOrden.estado_orden !== 'en_reparacion' && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleStartReparacion}
                                                disabled={isStartingReparacion}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                                            >
                                                {isStartingReparacion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                                                {__('Iniciar Reparación')}
                                            </Button>
                                        )}

                                        <Link href={`/admin/reparaciones/${scannedOrden.id}`}>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                {__('Ver Ficha')}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* PLANTILLA DE IMPRESIÓN OFICIAL TICKET 80MM (REPARACIÓN: CLIENTE - ALTA LEGIBILIDAD EN NEGRITA) */}
                {printOrden && (
                    <div id="printable-ticket-reparacion-index" className="hidden print:block text-black bg-white font-sans p-4 text-xs w-[72mm] max-w-[72mm] mx-auto box-border">
                        <style>{`
                            @media print {
                                * {
                                    box-sizing: border-box !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    color-adjust: exact !important;
                                }
                                html, body {
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    width: 72mm !important;
                                    max-width: 72mm !important;
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                }
                                body * {
                                    visibility: hidden !important;
                                }
                                #printable-ticket-reparacion-index, #printable-ticket-reparacion-index * {
                                    visibility: visible !important;
                                }
                                #printable-ticket-reparacion-index {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 72mm !important;
                                    max-width: 72mm !important;
                                    margin: 0 !important;
                                    padding: 1.5mm 2.5mm 3mm 2.5mm !important;
                                    box-sizing: border-box !important;
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
                                    font-weight: 700 !important;
                                    font-size: 11px !important;
                                    line-height: 1.3 !important;
                                    word-break: break-word !important;
                                    overflow-wrap: anywhere !important;
                                }
                                @page {
                                    size: 80mm auto;
                                    margin: 0;
                                }
                            }
                        `}</style>

                        {/* ================= TICKET PARA EL CLIENTE ================= */}
                        <div
                            style={{
                                fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
                                color: '#000000',
                                fontWeight: 700,
                                fontSize: '11px',
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                            className="text-black bg-white p-0"
                        >
                            {/* HEADER EMPRESA CON LOGO */}
                            <div className="text-center mb-1.5 flex flex-col items-center justify-center">
                                {empresaInfo?.logo || empresaInfo?.logo_mini ? (
                                    <img
                                        src={empresaInfo.logo || empresaInfo.logo_mini}
                                        alt={empresaInfo.razon_social || empresaInfo.nombre_comercial || 'Logo'}
                                        style={{
                                            width: `${Number(empresaInfo?.logo_ticket_size || 190)}px`,
                                            maxWidth: '92%',
                                            height: 'auto',
                                            maxHeight: '150px',
                                            filter: 'contrast(1.25)',
                                        }}
                                        className="mx-auto object-contain mb-1"
                                    />
                                ) : (
                                    <div className="font-black text-base uppercase tracking-tight text-black">{empresaInfo?.nombre_comercial || empresaInfo?.razon_social || 'SERVITEC'}</div>
                                )}
                            </div>

                            {/* DIRECCIÓN Y TELÉFONO CENTRADOS */}
                            {empresaInfo?.direccion && (
                                <div className="text-center font-extrabold text-[10px] uppercase px-0.5 leading-snug text-black">
                                    {empresaInfo.direccion}
                                </div>
                            )}
                            <div className="text-center font-black text-[11.5px] mt-0.5 text-black">
                                TEL: {empresaInfo?.telefono || empresaInfo?.whatsapp_phone || 'S/T'}
                            </div>

                            {/* BANNER NEGRO ORDEN N° */}
                            <div className="bg-black text-white text-center font-black text-[13.5px] py-1 my-2 uppercase tracking-wider">
                                ORDEN N° {printOrden.numero_orden}
                            </div>

                            {/* DATOS DEL CLIENTE */}
                            <div
                                style={{ borderBottom: '1.5px solid #000000' }}
                                className="text-center font-black text-[11.5px] uppercase mb-1 pb-0.5 text-black"
                            >
                                DATOS DEL CLIENTE
                            </div>
                            <div className="text-[10.5px] space-y-0.5 font-extrabold uppercase px-0.5 text-black">
                                <div><span className="font-black">NOMBRE: </span><span className="font-bold">{printOrden.cliente?.nombre || printOrden.cliente_nombre}</span></div>
                                <div><span className="font-black">TELEFONO: </span><span className="font-extrabold">{printOrden.cliente?.telefono || printOrden.cliente_telefono || '-'}</span></div>
                            </div>

                            {/* DATOS DEL EQUIPO */}
                            <div
                                style={{ borderBottom: '1.5px solid #000000' }}
                                className="text-center font-black text-[11.5px] uppercase mt-2.5 mb-1 pb-0.5 text-black"
                            >
                                DATOS DEL EQUIPO
                            </div>
                            <div className="text-[10.5px] space-y-0.5 font-extrabold uppercase px-0.5 text-black">
                                <div><span className="font-black">EQUIPO: </span><span className="font-bold">{printOrden.marca?.nombre || printOrden.marca_nombre} {printOrden.modelo?.nombre_comercial || printOrden.modelo_nombre}</span></div>
                                <div><span className="font-black">IMEI/SN: </span><span className="font-extrabold tracking-wide">{printOrden.imei_serie || 'NV'}</span></div>
                                <div><span className="font-black">OBSERVACIONES: </span><span className="font-bold">{printOrden.observaciones_fisicas || 'EQUIPO SIN OBSERVACIONES'}</span></div>
                                <div><span className="font-black">REPARACION: </span><span className="font-bold">{printOrden.descripcion_falla || (printOrden.items && printOrden.items.length > 0 ? printOrden.items.map((i: any) => i.descripcion || i.servicio?.nombre || i.producto?.nombre).join(', ') : 'REVISIÓN Y DIAGNÓSTICO')}</span></div>
                                <div><span className="font-black">ACCESORIOS: </span><span className="font-bold">{printOrden.accesorios_incluidos || 'NO DEJA'}</span></div>
                            </div>

                            {/* BANNER COSTO REPARACION */}
                            <div className="bg-black text-white text-center font-black text-[10.5px] py-1 mt-2.5 uppercase tracking-wide">
                                COSTO REPARACION
                            </div>
                            <div className="text-[11px] space-y-0.5 py-1 px-0.5 font-extrabold text-black">
                                <div className="flex justify-between gap-1.5">
                                    <span className="font-black">SUBTOTAL =</span>
                                    <span className="font-extrabold">${formatNum(printOrden.costo_estimado)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div className="flex justify-between gap-1.5">
                                    <span className="font-black">ANTICIPO =</span>
                                    <span className="font-extrabold">${formatNum(printOrden.anticipo)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div
                                    style={{ borderTop: '2px dashed #000000' }}
                                    className="flex justify-between gap-1.5 pt-1 mt-0.5 font-black text-[12px] text-black"
                                >
                                    <span>TOTAL =</span>
                                    <span>${formatNum(printOrden.saldo_restante)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                            </div>

                            {/* BANNER FECHA DE RECEPCION */}
                            <div className="bg-black text-white text-center font-black text-[10.5px] py-1 mt-1 uppercase tracking-wide">
                                FECHA DE RECEPCION
                            </div>
                            <div className="text-center text-[11px] font-extrabold py-1 text-black">
                                {formatDate(printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER FECHA APROX DE ENTREGA */}
                            <div className="bg-black text-white text-center font-black text-[10.5px] py-1 mt-1 uppercase tracking-wide">
                                FECHA APROX DE ENTREGA
                            </div>
                            <div className="text-center text-[11px] font-extrabold py-1 text-black">
                                {formatFullSpanishDate(printOrden.fecha_estimada_entrega || printOrden.fecha_prometida || printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER CONTRASEÑA */}
                            <div className="bg-black text-white text-center font-black text-[10.5px] py-1 mt-1 uppercase tracking-wide">
                                CONTRASEÑA
                            </div>
                            <div className="py-1.5">
                                {extractPatternNumbers(printOrden.contrasena_patron).length > 0 ? (
                                    <PrintablePatternLock pattern={extractPatternNumbers(printOrden.contrasena_patron)} />
                                ) : (
                                    <div className="text-center font-black text-[12.5px] py-1 text-black">
                                        {printOrden.contrasena_patron || 'Sin contraseña'}
                                    </div>
                                )}
                            </div>

                            {/* TÉCNICO ASIGNADO */}
                            {printOrden.tecnico?.name && (
                                <div
                                    style={{ borderTop: '1.5px dashed #000000' }}
                                    className="mt-1.5 pt-1.5 text-center text-black"
                                >
                                    <div className="text-[9.5px] uppercase font-extrabold text-black">TÉCNICO ASIGNADO:</div>
                                    <div className="text-[11px] uppercase font-black text-black mt-0.5">{printOrden.tecnico.name}</div>
                                </div>
                            )}

                            {/* CÓDIGO DE BARRAS Y CÓDIGO DE REPARACIÓN */}
                            <div className="text-center py-2 flex flex-col items-center text-black">
                                <div className="w-full max-w-[62mm] overflow-hidden flex justify-center py-0.5">
                                    <BarcodeSVG
                                        value={printOrden.numero_orden}
                                        width={1.55}
                                        height={46}
                                        displayValue={false}
                                    />
                                </div>
                                <div className="text-[10.5px] font-black uppercase mt-1 tracking-wider text-black">
                                    CÓDIGO DE REPARACIÓN: {printOrden.numero_orden}
                                </div>
                                <div className="text-[8.5px] text-black font-bold mt-0.5">
                                    Escanee el código para consultar estado o cobrar en POS
                                </div>
                            </div>

                            {/* TÉRMINOS Y GARANTÍA CON RECUADRO DE FIRMA */}
                            <div className="pt-1.5 text-black">
                                <div className="text-[9.5px] font-extrabold text-left mb-1 text-black">
                                    Términos y Condiciones de Garantía:
                                </div>
                                <div className="border-2 border-black h-12 w-full box-border mb-1 bg-white"></div>
                                <div className="text-center font-black text-[10.5px] uppercase text-black">
                                    FIRMA DE CONFORMIDAD
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL ETIQUETA TÉRMICA AUTOADHESIVA */}
            {selectedStickerOrden && (
                <EtiquetaTermicaModal
                    open={isStickerModalOpen}
                    onOpenChange={setIsStickerModalOpen}
                    orden={selectedStickerOrden}
                    empresa={empresa}
                />
            )}
        </>
    );
}
