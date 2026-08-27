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
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    tecnico?: { name: string };
    cliente?: { nombre: string; telefono?: string };
    marca?: { nombre: string };
    modelo?: { nombre_comercial: string; codigo_modelo?: string };
    items?: Array<{ id: number; descripcion?: string; precio: number; cantidad: number; servicio?: { nombre: string }; producto?: { nombre: string } }>;
    empresa?: any;
    sucursal?: any;
}

interface Props {
    ordenes: Paginated<Orden>;
    counts: Record<string, number>;
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
    filters: {
        search?: string;
        status?: string;
        tecnico_id?: string;
        perPage?: string;
    };
    isTecnicoOnly?: boolean;
    empresa?: any;
}

export default function IndexReparaciones({ ordenes, counts, tecnicos, currencySymbol, filters, isTecnicoOnly, empresa }: Props) {
    const { __ } = useTranslate();
    const pageUser = usePage<any>().props.auth?.user;
    const empresaInfo = empresa || pageUser?.empresa;
    const isUserTecnico = isTecnicoOnly || Boolean(pageUser?.roles?.some((r: any) => String(r.name).toLowerCase().includes('tecnic'))) || pageUser?.tipo_usuario === 'tecnico';

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [tecnicoId, setTecnicoId] = useState(filters.tecnico_id || 'all');
    const [perPage, setPerPage] = useState(filters.perPage ? String(filters.perPage) : '10');

    // Quick Print Ticket State
    const [printOrden, setPrintOrden] = useState<Orden | null>(null);

    // Auto debounce filters
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/reparaciones',
                cleanParams({
                    search: search || undefined,
                    status: status === 'all' ? undefined : status,
                    tecnico_id: tecnicoId === 'all' ? undefined : tecnicoId,
                    perPage: perPage === '10' ? undefined : perPage,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, status, tecnicoId, perPage]);

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
            } catch (e) {}
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
                } catch (e) {}
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
                        () => {}
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

        let cleanCode = code.trim();
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

    const handleResetFilters = () => {
        setSearch('');
        setStatus('all');
        setTecnicoId('all');
        setPerPage('10');
        router.get('/admin/reparaciones', {}, { preserveState: true, preserveScroll: true });
    };

    const sendWhatsApp = (o: Orden) => {
        const phone = o.cliente?.telefono || o.cliente_telefono;
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const clientName = o.cliente?.nombre || o.cliente_nombre;
        const brandName = o.marca?.nombre || o.marca_nombre;
        const modelName = o.modelo?.nombre_comercial || o.modelo_nombre;
        const msg = encodeURIComponent(
            `Hola *${clientName}*, le saludamos del Servicio Técnico.\nSu equipo *${brandName} ${modelName}* (Orden *${o.numero_orden}*) se encuentra actualmente en estado: *${o.estado_orden.toUpperCase().replace('_', ' ')}*.\nSaldo pendiente: *${currencySymbol}${formatNum(o.saldo_restante)}*.\n\nPara cualquier consulta, puede responder a este mensaje.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {__('Recibido')}
                    </span>
                );
            case 'en_diagnostico':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {__('En Diagnóstico')}
                    </span>
                );
            case 'presupuestado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        {__('Presupuestado')}
                    </span>
                );
            case 'en_reparacion':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        {__('En Reparación')}
                    </span>
                );
            case 'esperando_repuesto':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        {__('Esperando Repuesto')}
                    </span>
                );
            case 'reparado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {__('Listo p/ Entrega')}
                    </span>
                );
            case 'entregado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-300"></span>
                        {__('Entregado')}
                    </span>
                );
            case 'cancelado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {__('Sin Arreglo')}
                    </span>
                );
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{st}</span>;
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
    ];

    const columns: ColumnDef<Orden>[] = [
        {
            header: __('Folio / Fecha'),
            accessorKey: 'numero_orden',
            cell: (o) => (
                <div className="flex flex-col gap-0.5">
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
                        <span>{formatDate(o.fecha_recepcion)}</span>
                    </div>
                </div>
            ),
        },
        {
            header: __('Cliente'),
            accessorKey: 'cliente_nombre',
            cell: (o) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {o.cliente?.nombre || o.cliente_nombre}
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
            header: __('Dispositivo / Modelo'),
            accessorKey: 'modelo_nombre',
            cell: (o) => (
                <div className="flex flex-col">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{o.marca?.nombre || o.marca_nombre} {o.modelo?.nombre_comercial || o.modelo_nombre}</span>
                    </div>
                    {o.imei_serie && (
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            IMEI: {o.imei_serie}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: __('Falla Reportada'),
            accessorKey: 'descripcion_falla',
            cell: (o) => (
                <p className="text-slate-700 dark:text-slate-300 text-xs max-w-xs truncate" title={o.descripcion_falla}>
                    {o.descripcion_falla || __('Sin detalle especificado')}
                </p>
            ),
        },
        {
            header: __('Estado'),
            accessorKey: 'estado_orden',
            className: 'text-center',
            cell: (o) => getStatusBadge(o.estado_orden),
        },
        {
            header: __('Presupuesto'),
            accessorKey: 'costo_estimado',
            className: 'text-right',
            cell: (o) => (
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {currencySymbol}{formatNum(o.costo_estimado)}
                </span>
            ),
        },
        {
            header: __('Saldo a Cobrar'),
            accessorKey: 'saldo_restante',
            className: 'text-right',
            cell: (o) => (
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {currencySymbol}{formatNum(o.saldo_restante)}
                </span>
            ),
        },
        {
            header: __('Acciones'),
            className: 'text-center',
            hideable: false,
            stopRowClick: true,
            cell: (o) => (
                <div className="flex items-center justify-center gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleQuickPrintTicket(o);
                        }}
                        className="h-8 text-xs font-bold gap-1 border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                        title={__('Imprimir Ticket de Cliente')}
                    >
                        <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {__('Ticket')}
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.visit(`/admin/reparaciones/${o.id}`);
                        }}
                        className="h-8 text-xs font-bold gap-1 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950/40"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        {__('Ficha')}
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
                        {__('Escanear QR')}
                    </Button>

                    <Link href="/admin/reparaciones/create">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2">
                            <Plus className="h-4 w-4" />
                            {__('Nueva Recepción')}
                        </Button>
                    </Link>
                </ModuleHeader>

                {/* BARRA DE FILTROS ESTÁNDAR */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por Folio, Cliente, IMEI o Modelo...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full md:w-80"
                            />
                        </FilterField>

                        <FilterField label={__('Estado')}>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('Todos los estados')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los estados')}</SelectItem>
                                    <SelectItem value="recibido">{__('Recibido')}</SelectItem>
                                    <SelectItem value="en_diagnostico">{__('En Diagnóstico')}</SelectItem>
                                    <SelectItem value="presupuestado">{__('Presupuestado')}</SelectItem>
                                    <SelectItem value="en_reparacion">{__('En Reparación')}</SelectItem>
                                    <SelectItem value="esperando_repuesto">{__('Esperando Repuesto')}</SelectItem>
                                    <SelectItem value="reparado">{__('Listo p/ Entrega')}</SelectItem>
                                    <SelectItem value="entregado">{__('Entregado')}</SelectItem>
                                    <SelectItem value="cancelado">{__('Sin Arreglo')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        {!isTecnicoOnly && tecnicos.length > 0 && (
                            <FilterField label={__('Técnico')}>
                                <Select value={tecnicoId} onValueChange={setTecnicoId}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <SelectValue placeholder={__('Todos los técnicos')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('Todos los técnicos')}</SelectItem>
                                        {tecnicos.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        )}

                        <FilterField label={__('Registros por página')}>
                            <Select value={perPage} onValueChange={setPerPage}>
                                <SelectTrigger className="w-full md:w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        {(search || status !== 'all' || tecnicoId !== 'all' || perPage !== '10') && (
                            <Button
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                {__('Limpiar Filtros')}
                            </Button>
                        )}
                    </div>
                </FilterBar>

                {/* TABLA DE DATOS ESTÁNDAR DATA-TABLE */}
                <DataTable
                    columns={columns}
                    data={ordenes}
                    filters={filters}
                    onRowClick={(row) => router.visit(`/admin/reparaciones/${row.id}`)}
                    emptyState={{
                        title: __('No se encontraron órdenes de reparación'),
                        description: __('Intenta modificar los filtros de búsqueda o registra una nueva orden de servicio.'),
                        icon: <Wrench className="w-10 h-10 text-slate-300 dark:text-slate-600" />,
                        ctaLabel: __('Nueva Recepción'),
                        onCtaClick: () => router.visit('/admin/reparaciones/create'),
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
                                    onChange={(e) => setScanInput(e.target.value)}
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

                {/* PLANTILLA DE IMPRESIÓN OFICIAL TICKET 80MM (REPARACIÓN: CLIENTE) */}
                {printOrden && (
                    <div id="printable-ticket-reparacion-index" className="hidden print:block text-black bg-white font-sans p-4 text-xs w-[80mm] max-w-[80mm] mx-auto">
                        <style>{`
                            @media print {
                                * {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    color-adjust: exact !important;
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
                                    width: 80mm !important;
                                    max-width: 80mm !important;
                                    margin: 0 !important;
                                    padding: 2mm !important;
                                    background: white !important;
                                    color: black !important;
                                    font-family: 'Courier New', Courier, monospace, Arial, sans-serif !important;
                                    font-size: 11px !important;
                                }
                                @page {
                                    size: 80mm auto;
                                    margin: 0;
                                }
                            }
                        `}</style>

                        {/* ================= TICKET PARA EL CLIENTE ================= */}
                        <div className="font-mono text-black text-xs leading-tight p-0 bg-white">
                            {/* HEADER EMPRESA CON LOGO MINI */}
                            <div className="text-center mb-1">
                                {empresaInfo?.logo_mini || empresaInfo?.logo ? (
                                    <img
                                        src={empresaInfo.logo_mini || empresaInfo.logo}
                                        alt={empresaInfo.razon_social || 'Logo'}
                                        style={{ maxWidth: `${Number(empresaInfo?.logo_ticket_size || 200)}px`, maxHeight: `${Math.round(Number(empresaInfo?.logo_ticket_size || 200) * 0.75)}px` }}
                                        className="mx-auto object-contain mb-1"
                                    />
                                ) : (
                                    <div className="font-black text-base uppercase tracking-tight">{empresaInfo?.razon_social || 'SERVITEC'}</div>
                                )}
                            </div>

                            {/* DIRECCIÓN Y TELÉFONO CENTRADOS */}
                            {empresaInfo?.direccion && (
                                <div className="text-center font-bold text-[9px] uppercase px-1 leading-snug font-mono">
                                    {empresaInfo.direccion}
                                </div>
                            )}
                            <div className="text-center font-bold text-[10.5px] mt-0.5 font-mono">
                                TEL: {empresaInfo?.telefono || empresaInfo?.whatsapp_phone || 'S/T'}
                            </div>

                            {/* BANNER NEGRO ORDEN N° */}
                            <div className="bg-black text-white text-center font-black text-sm py-1 my-2 uppercase tracking-wider">
                                ORDEN N° {printOrden.numero_orden}
                            </div>

                            {/* DATOS DEL CLIENTE */}
                            <div className="text-center font-black text-[11px] uppercase mb-1">
                                DATOS DEL CLIENTE
                            </div>
                            <div className="text-[10px] space-y-0.5 font-bold uppercase px-1">
                                <div>NOMBRE: <span className="font-normal">{printOrden.cliente?.nombre || printOrden.cliente_nombre}</span></div>
                                <div>TELEFONO: <span className="font-normal">{printOrden.cliente?.telefono || printOrden.cliente_telefono || '-'}</span></div>
                            </div>

                            {/* DATOS DEL EQUIPO */}
                            <div className="text-center font-black text-[11px] uppercase mt-3 mb-1">
                                DATOS DEL EQUIPO
                            </div>
                            <div className="text-[10px] space-y-0.5 font-bold uppercase px-1">
                                <div>EQUIPO: <span className="font-normal">{printOrden.marca?.nombre || printOrden.marca_nombre} {printOrden.modelo?.nombre_comercial || printOrden.modelo_nombre}</span></div>
                                <div>IMEI/SN: <span className="font-normal">{printOrden.imei_serie || 'nv'}</span></div>
                                <div>OBSERVACIONES: <span className="font-normal">{printOrden.observaciones_fisicas || 'equipo sin observaciones'}</span></div>
                                <div>REPARACION: <span className="font-normal">{printOrden.descripcion_falla || (printOrden.items && printOrden.items.length > 0 ? printOrden.items.map((i: any) => i.descripcion || i.servicio?.nombre || i.producto?.nombre).join(', ') : 'Revisión y diagnóstico')}</span></div>
                                <div>ACCESORIOS: <span className="font-normal">{printOrden.accesorios_incluidos || 'no deja'}</span></div>
                            </div>

                            {/* BANNER COSTO REPARACION */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-3 uppercase tracking-wide">
                                COSTO REPARACION
                            </div>
                            <div className="text-[10px] space-y-0.5 py-1 px-1 font-bold">
                                <div className="flex justify-between">
                                    <span>SUBTOTAL =</span>
                                    <span>${formatNum(printOrden.costo_estimado)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ANTICIPO =</span>
                                    <span>${formatNum(printOrden.anticipo)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                                <div className="flex justify-between border-t border-dotted border-black pt-0.5 font-black">
                                    <span>TOTAL =</span>
                                    <span>${formatNum(printOrden.saldo_restante)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                                </div>
                            </div>

                            {/* BANNER FECHA DE RECEPCION */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide">
                                FECHA DE RECEPCION
                            </div>
                            <div className="text-center text-[10px] font-bold py-1">
                                {formatDate(printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER FECHA APROX DE ENTREGA */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide">
                                FECHA APROX DE ENTREGA
                            </div>
                            <div className="text-center text-[10px] font-bold py-1">
                                {formatFullSpanishDate(printOrden.fecha_estimada_entrega || printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER CONTRASEÑA */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide">
                                CONTRASEÑA
                            </div>
                            <div className="py-2">
                                {extractPatternNumbers(printOrden.contrasena_patron).length > 0 ? (
                                    <PrintablePatternLock pattern={extractPatternNumbers(printOrden.contrasena_patron)} />
                                ) : (
                                    <div className="text-center font-bold text-xs py-1">
                                        {printOrden.contrasena_patron || 'Sin contraseña'}
                                    </div>
                                )}
                            </div>

                            {/* CÓDIGO DE BARRAS Y CÓDIGO DE REPARACIÓN */}
                            <div className="text-center py-2.5 flex flex-col items-center">
                                <div className="w-full max-w-[250px] overflow-hidden flex justify-center py-1">
                                    <BarcodeSVG
                                        value={printOrden.numero_orden}
                                        width={1.6}
                                        height={48}
                                        displayValue={false}
                                    />
                                </div>
                                <div className="text-[10px] font-black uppercase mt-1 font-mono tracking-wider">
                                    CÓDIGO DE REPARACIÓN: {printOrden.numero_orden}
                                </div>
                                <div className="text-[7.5px] text-gray-700 font-semibold font-mono">
                                    Escanee el código para consultar estado o cobrar en POS
                                </div>
                            </div>

                            {/* TÉRMINOS Y GARANTÍA CON RECUADRO DE FIRMA */}
                            <div className="pt-2">
                                <div className="text-[9px] font-bold text-left mb-1 font-mono">
                                    Términos y Condiciones de Garantía:
                                </div>
                                <div className="border-2 border-black h-12 w-full mb-1 bg-white"></div>
                                <div className="text-center font-black text-[10px] uppercase font-mono">
                                    FIRMA DE CONFORMIDAD
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
