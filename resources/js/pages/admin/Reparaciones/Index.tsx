import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Wrench,
    Plus,
    Search,
    Eye,
    Printer,
    Send,
    User,
    Smartphone,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Filter,
    FileText,
    Copy,
    RefreshCw,
    XCircle,
    ChevronRight,
    Sparkles,
    QrCode,
    Camera,
    Loader2,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { decodeQRCodeFromImageData } from '@/components/qr-decoder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { QRCodeSVG } from '@/components/qr-code-svg';

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
    ordenes: {
        data: Orden[];
        links?: any[];
        total: number;
        current_page: number;
        last_page: number;
        per_page?: number;
        from?: number | null;
        to?: number | null;
    };
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

    // QR Code Camera Scanner States
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [scannedOrden, setScannedOrden] = useState<any | null>(null);
    const [isSearchingOrden, setIsSearchingOrden] = useState(false);
    const [isStartingReparacion, setIsStartingReparacion] = useState(false);

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
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
                    console.error('Plugin start error:', err);
                    setCameraError(__('No se pudo acceder a la cámara o el permiso fue denegado.'));
                    setIsCameraActive(false);
                }
            }, 150);
        } catch (err: any) {
            console.error('Plugin load error:', err);
            setCameraError(__('Error al iniciar la cámara.'));
            setIsCameraActive(false);
        }
    };

    const handleSearchByCode = async (codeToSearch?: string) => {
        let query = (codeToSearch || scanInput).trim();
        if (!query) return;

        // Limpiar basura o ruídos de lectura
        query = query.replace(/[^\w\s\/:?=#.-]/gi, '').trim();
        if (!query) return;

        setIsSearchingOrden(true);
        try {
            const res = await fetch(`/admin/reparaciones/api-find?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success && data.orden) {
                setScannedOrden(data.orden);
                notifySuccess(__('Orden de reparación encontrada.'));
            } else {
                notifyError(data.error || __('No se encontró ninguna reparación con ese folio o QR.'));
                setScannedOrden(null);
            }
        } catch (err) {
            notifyError(__('Error al consultar el servidor.'));
            setScannedOrden(null);
        } finally {
            setIsSearchingOrden(false);
        }
    };

    const handleStartReparacion = () => {
        if (!scannedOrden) return;
        setIsStartingReparacion(true);

        router.post(
            `/admin/reparaciones/${scannedOrden.id}/estado`,
            {
                estado_orden: 'en_reparacion',
                comentario: __('Proceso de reparación iniciado desde escáner QR.'),
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

    const handleFilter = (customStatus?: string, customPerPage?: string) => {
        const targetStatus = customStatus !== undefined ? customStatus : status;
        const targetPerPage = customPerPage !== undefined ? customPerPage : perPage;
        router.get(
            '/admin/reparaciones',
            cleanParams({
                search,
                status: targetStatus === 'all' ? undefined : targetStatus,
                tecnico_id: tecnicoId === 'all' ? undefined : tecnicoId,
                perPage: targetPerPage,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setTecnicoId('all');
        setPerPage('10');
        router.get('/admin/reparaciones', {}, { preserveState: true, preserveScroll: true });
    };

    const sendWhatsApp = (o: Orden) => {
        if (!o.cliente_telefono) return;
        const cleanPhone = o.cliente_telefono.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
            `Hola *${o.cliente_nombre}*, le saludamos del Servicio Técnico.\nSu equipo *${o.marca_nombre} ${o.modelo_nombre}* (Orden *${o.numero_orden}*) se encuentra actualmente en estado: *${o.estado_orden.toUpperCase().replace('_', ' ')}*.\nSaldo pendiente: *${currencySymbol}${formatNum(o.saldo_restante)}*.\n\nPara cualquier consulta, puede responder a este mensaje.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold px-2.5 py-0.5 text-xs gap-1">🟡 {__('Recibido')}</Badge>;
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-bold px-2.5 py-0.5 text-xs gap-1">🔍 {__('En Diagnóstico')}</Badge>;
            case 'presupuestado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold px-2.5 py-0.5 text-xs gap-1">💵 {__('Presupuestado')}</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold px-2.5 py-0.5 text-xs gap-1">🛠️ {__('En Reparación')}</Badge>;
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold px-2.5 py-0.5 text-xs gap-1">📦 {__('Esperando Repuesto')}</Badge>;
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold px-2.5 py-0.5 text-xs gap-1">🟢 {__('Listo p/ Entrega')}</Badge>;
            case 'entregado':
                return <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold px-2.5 py-0.5 text-xs gap-1">✅ {__('Entregado')}</Badge>;
            case 'cancelado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold px-2.5 py-0.5 text-xs gap-1">❌ {__('Sin Arreglo')}</Badge>;
            default:
                return <Badge variant="outline">{st}</Badge>;
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
    ];



    return (
        <>
            <Head title={__('Servicio Técnico & Reparaciones')} />

            <div className="w-full space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ENCABEZADO PRINCIPAL DE MÓDULO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 shadow-xs">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                {isTecnicoOnly ? __('Mis Órdenes de Reparación') : __('Taller & Servicio Técnico')}
                                <Badge variant="secondary" className="text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                                    {ordenes.total} {isTecnicoOnly ? __('asignadas') : __('órdenes')}
                                </Badge>
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {isTecnicoOnly ? __('Listado de equipos bajo tu responsabilidad directa de trabajo y taller.') : __('Recepción de equipos, estado de taller, trazabilidad de repuestos y notificaciones vía WhatsApp.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsScanModalOpen(true);
                                startCamera();
                            }}
                            variant="outline"
                            className="h-10 px-4 gap-2 text-xs font-bold border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl shadow-xs"
                        >
                            <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            {__('Escanear QR')}
                        </Button>

                        <Link href="/admin/reparaciones/create">
                            <Button className="h-10 px-5 gap-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-950/20 rounded-xl transition-all">
                                <Plus className="w-4 h-4" />
                                {__('Nueva Recepción')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* CARD DE FILTROS Y BÚSQUEDA AVANZADA */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={__('Buscar por Folio (ej: REP-000001), Cliente, IMEI o Modelo...')}
                                    className="text-xs pl-9 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>

                            {tecnicos.length > 0 && (
                                <div className="w-full md:w-56">
                                    <Select value={tecnicoId} onValueChange={(val) => setTecnicoId(val)}>
                                        <SelectTrigger className="text-xs h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                            <SelectValue placeholder={__('Filtrar por técnico...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{__('Todos los técnicos')}</SelectItem>
                                            {tecnicos.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                    🛠️ {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="w-full md:w-36">
                                <Select
                                    value={perPage}
                                    onValueChange={(val) => {
                                        setPerPage(val);
                                        handleFilter(undefined, val);
                                    }}
                                >
                                    <SelectTrigger className="text-xs h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                        <SelectValue placeholder={__('Paginación')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10" className="text-xs">10 {__('filas')}</SelectItem>
                                        <SelectItem value="25" className="text-xs">25 {__('filas')}</SelectItem>
                                        <SelectItem value="50" className="text-xs">50 {__('filas')}</SelectItem>
                                        <SelectItem value="100" className="text-xs">100 {__('filas')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Button onClick={() => handleFilter()} size="sm" className="h-10 px-5 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 shrink-0">
                                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                                    {__('Filtrar')}
                                </Button>
                                {(search || (status && status !== 'all') || (tecnicoId && tecnicoId !== 'all') || (perPage && perPage !== '10')) && (
                                    <Button onClick={handleReset} variant="outline" size="sm" className="h-10 text-xs text-slate-500 hover:text-slate-900 shrink-0">
                                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                        {__('Limpiar')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* TABLA DE ÓRDENES CON DISEÑO DASHBOARD */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800 tracking-wider">
                                <tr>
                                    <th className="px-4 py-3.5">{__('Folio / Fecha')}</th>
                                    <th className="px-4 py-3.5">{__('Cliente')}</th>
                                    <th className="px-4 py-3.5">{__('Dispositivo / Modelo')}</th>
                                    <th className="px-4 py-3.5">{__('Falla Reportada')}</th>
                                    <th className="px-4 py-3.5 text-center">{__('Estado')}</th>
                                    <th className="px-4 py-3.5 text-right">{__('Presupuesto')}</th>
                                    <th className="px-4 py-3.5 text-right">{__('Saldo a Cobrar')}</th>
                                    <th className="px-4 py-3.5 text-center">{__('Acciones')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ordenes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                                <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">{__('No se encontraron órdenes de reparación con los filtros seleccionados.')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    ordenes.data.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* FOLIO Y FECHA */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-400">
                                                        {o.numero_orden}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(o.numero_orden)}
                                                        className="text-slate-400 hover:text-purple-600 transition-colors"
                                                        title={__('Copiar Folio')}
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-slate-400 block font-mono">
                                                    📅 {formatDate(o.fecha_recepcion)}
                                                </span>
                                            </td>

                                            {/* CLIENTE */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                                        {o.cliente_nombre}
                                                    </span>
                                                    {o.cliente_telefono && (
                                                        <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-semibold block">
                                                            {o.cliente_telefono}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* DISPOSITIVO */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                                        {o.marca_nombre} {o.modelo_nombre}
                                                    </span>
                                                    {o.imei_serie && (
                                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                                                            IMEI: <strong className="text-slate-700 dark:text-slate-300">{o.imei_serie}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* FALLA REPORTADA */}
                                            <td className="px-4 py-3.5 max-w-xs">
                                                <p className="text-slate-700 dark:text-slate-300 text-xs truncate" title={o.descripcion_falla}>
                                                    {o.descripcion_falla || __('Sin detalle especificado')}
                                                </p>
                                            </td>

                                            {/* ESTADO */}
                                            <td className="px-4 py-3.5 text-center">
                                                {getStatusBadge(o.estado_orden)}
                                            </td>

                                            {/* PRESUPUESTO */}
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {currencySymbol}{formatNum(o.costo_estimado)}
                                            </td>

                                            {/* SALDO A COBRAR */}
                                            <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                                {currencySymbol}{formatNum(o.saldo_restante)}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleQuickPrintTicket(o)}
                                                        className="h-8 text-xs font-bold gap-1 border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                                                        title={__('Imprimir Ticket de Cliente')}
                                                    >
                                                        <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                        {__('Ticket')}
                                                    </Button>

                                                    <Link href={`/admin/reparaciones/${o.id}`}>
                                                        <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-900 dark:text-purple-300">
                                                            <Eye className="w-3.5 h-3.5" />
                                                            {__('Ficha')}
                                                        </Button>
                                                    </Link>

                                                    {o.cliente_telefono && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => sendWhatsApp(o)}
                                                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                                            title={__('Enviar estado por WhatsApp')}
                                                        >
                                                            <Send className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {ordenes && ordenes.total > 0 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                            <Pagination paginatedData={ordenes as any} filters={filters} />
                        </div>
                    )}
                </Card>

                {/* MODAL ESCANEAR CÓDIGO QR DE REPARACIÓN */}
                <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
                    <DialogContent className="sm:max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                {__('Escanear Código QR de Reparación')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5 py-2">
                            {/* VISOR DE CÁMARA O BÚSQUEDA MANUAL */}
                            {!scannedOrden ? (
                                <div className="space-y-4">
                                    <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[360px] w-full border-2 border-purple-500/50 flex flex-col items-center justify-center text-white shadow-lg">
                                        {isCameraActive ? (
                                            <div id="qr-reader-container" className="w-full h-full min-h-[320px] sm:min-h-[360px] overflow-hidden rounded-2xl" />
                                        ) : (
                                            <div className="p-6 text-center space-y-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-purple-400 border border-slate-800">
                                                    <Camera className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs text-slate-300 max-w-xs">
                                                    {cameraError || __('Haga clic en Activar Cámara o ingrese manualmente el Folio.')}
                                                </p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={startCamera}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 rounded-xl"
                                                >
                                                    <Camera className="w-3.5 h-3.5" />
                                                    {__('Activar Cámara')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* BÚSQUEDA MANUAL / PISTOLA QR */}
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {__('O ingrese Folio / Pegue la URL del QR:')}
                                        </label>
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSearchByCode();
                                            }}
                                            className="flex gap-2"
                                        >
                                            <Input
                                                value={scanInput}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setScanInput(val);
                                                    if (val.includes('reparaciones/') || val.length >= 6) {
                                                        handleSearchByCode(val);
                                                    }
                                                }}
                                                placeholder={__('Ej: REP-000005 o URL')}
                                                className="h-10 text-xs font-mono"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={isSearchingOrden || !scanInput.trim()}
                                                className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 rounded-xl shrink-0"
                                            >
                                                {isSearchingOrden ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                                {__('Buscar')}
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                /* DETALLE DE LA ORDEN LOCALIZADA */
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                                        <div>
                                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase block">
                                                {__('Orden de Reparación Localizada')}
                                            </span>
                                            <h3 className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                {scannedOrden.numero_orden}
                                            </h3>
                                        </div>
                                        <div>{getStatusBadge(scannedOrden.estado_orden)}</div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                                            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-purple-500" />
                                                {__('Cliente:')}
                                            </div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{scannedOrden.cliente_nombre}</p>
                                            {scannedOrden.cliente_telefono && (
                                                <p className="text-[11px] text-slate-500 font-mono">{scannedOrden.cliente_telefono}</p>
                                            )}
                                        </div>

                                        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                                            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                                                {__('Equipo / Dispositivo:')}
                                            </div>
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {scannedOrden.marca_nombre} {scannedOrden.modelo_nombre} ({scannedOrden.tipo_dispositivo})
                                            </p>
                                            {scannedOrden.imei_serie && (
                                                <p className="text-[11px] text-slate-500 font-mono">IMEI: {scannedOrden.imei_serie}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                                        <div className="font-bold text-slate-700 dark:text-slate-300">{__('Falla Reportada:')}</div>
                                        <p className="text-slate-800 dark:text-slate-200 italic bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                                            "{scannedOrden.descripcion_falla}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-900/50">
                                        <div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{__('Costo Estimado Total')}</span>
                                            <span className="font-black text-slate-900 dark:text-slate-100">{currencySymbol}{formatNum(scannedOrden.costo_estimado)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{__('Saldo Pendiente')}</span>
                                            <span className="font-black text-purple-700 dark:text-purple-300">{currencySymbol}{formatNum(scannedOrden.saldo_restante)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setScannedOrden(null); startCamera(); }}
                                            className="h-10 text-xs font-bold rounded-xl gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            {__('Escanear Otro')}
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            {/* SI ES TÉCNICO: BOTÓN INICIAR REPARACIÓN */}
                                            {isUserTecnico && scannedOrden.estado_orden !== 'en_reparacion' && scannedOrden.estado_orden !== 'reparado' && scannedOrden.estado_orden !== 'entregado' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleStartReparacion}
                                                    disabled={isStartingReparacion}
                                                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-2 rounded-xl shadow-md"
                                                >
                                                    {isStartingReparacion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                                                    {__('Iniciar Reparación')}
                                                </Button>
                                            )}

                                            <Link href={`/admin/reparaciones/${scannedOrden.id}`}>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {__('Ver Ficha Completa')}
                                                </Button>
                                            </Link>
                                        </div>
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
                        <div className="font-mono text-black text-xs leading-tight border-2 border-black p-2 bg-white">
                            {/* HEADER EMPRESA CON LOGO MINI */}
                            <div className="text-center mb-1">
                                {empresaInfo?.logo_mini || empresaInfo?.logo ? (
                                    <img
                                        src={empresaInfo.logo_mini || empresaInfo.logo}
                                        alt={empresaInfo.razon_social || 'Logo'}
                                        className="h-16 max-w-[160px] mx-auto object-contain mb-1"
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
                            <div className="text-center font-bold text-[10px] mt-0.5 font-mono">
                                TELEFONO: {empresaInfo?.telefono || ''}
                            </div>

                            {/* BANNER NEGRO ORDEN N° CON BORDES NEGROS SÓLIDOS */}
                            <div className="bg-black text-white text-center font-black text-sm py-1 my-2 uppercase tracking-wider border-y-2 border-black">
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

                            {/* BANNER COSTO REPARACION CON BORDES NEGROS SÓLIDOS */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-3 uppercase tracking-wide border-y border-black">
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
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide border-y border-black">
                                FECHA DE RECEPCION
                            </div>
                            <div className="text-center text-[10px] font-bold py-1">
                                {formatDate(printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER FECHA APROX DE ENTREGA */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide border-y border-black">
                                FECHA APROX DE ENTREGA
                            </div>
                            <div className="text-center text-[10px] font-bold py-1">
                                {formatFullSpanishDate(printOrden.fecha_estimada_entrega || printOrden.fecha_recepcion)}
                            </div>

                            {/* BANNER CONTRASEÑA */}
                            <div className="bg-black text-white text-center font-black text-[10px] py-0.5 mt-1 uppercase tracking-wide border-y border-black">
                                CONTRASEÑA
                            </div>
                            <div className="py-2 border-b-2 border-black">
                                {extractPatternNumbers(printOrden.contrasena_patron).length > 0 ? (
                                    <PrintablePatternLock pattern={extractPatternNumbers(printOrden.contrasena_patron)} />
                                ) : (
                                    <div className="text-center font-bold text-xs py-1">
                                        {printOrden.contrasena_patron || 'Sin contraseña'}
                                    </div>
                                )}
                            </div>

                            {/* CÓDIGO QR Y CÓDIGO DE REPARACIÓN */}
                            <div className="text-center py-2.5 border-b-2 border-black flex flex-col items-center bg-gray-50/50">
                                <QRCodeSVG
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/reparaciones/${printOrden.id}/reporte-pdf`}
                                    size={110}
                                />
                                <div className="text-[9px] font-black uppercase mt-1.5 font-mono tracking-wider">
                                    CÓDIGO DE REPARACIÓN: {printOrden.numero_orden}
                                </div>
                                <div className="text-[7.5px] text-gray-700 font-semibold font-mono">
                                    Escanee para consultar estado o ver reporte completo
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
                            <div className="border-b-2 border-black pt-2"></div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
