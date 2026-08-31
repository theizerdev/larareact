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
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
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
    marcas?: Array<{ id: number; nombre: string; modelos?: any[] }>;
    modelos?: Array<{ id: number; marca_id?: number; categoria_id?: number; nombre_comercial: string; codigo_modelo?: string }>;
    categorias?: Array<{ id: number; nombre: string }>;
    currencySymbol: string;
    filters: {
        search?: string;
        status?: string;
        tecnico_id?: string;
        marca_id?: string;
        modelo_id?: string;
        categoria_id?: string;
        perPage?: string;
    };
    isTecnicoOnly?: boolean;
    empresa?: any;
}

export default function IndexReparaciones({
    ordenes,
    counts,
    tecnicos,
    marcas = [],
    modelos = [],
    categorias = [],
    currencySymbol,
    filters,
    isTecnicoOnly,
    empresa,
}: Props) {
    const { __ } = useTranslate();
    const pageUser = usePage<any>().props.auth?.user;
    const empresaInfo = empresa || pageUser?.empresa;
    const isUserTecnico = isTecnicoOnly || Boolean(pageUser?.roles?.some((r: any) => String(r.name).toLowerCase().includes('tecnic'))) || pageUser?.tipo_usuario === 'tecnico';

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [marcaId, setMarcaId] = useState(filters.marca_id || 'all');
    const [modeloId, setModeloId] = useState(filters.modelo_id || 'all');
    const [categoriaId, setCategoriaId] = useState(filters.categoria_id || 'all');
    const [perPage, setPerPage] = useState(filters.perPage ? String(filters.perPage) : '10');

    // Quick Print Ticket State
    const [printOrden, setPrintOrden] = useState<Orden | null>(null);

    // Filter available models dynamically based on selected Marca and Categoria
    const availableModelos = useMemo(() => {
        let list: any[] = modelos || [];
        if (!list.length && marcas?.length) {
            list = marcas.flatMap((m) =>
                (m.modelos || []).map((mod: any) => ({
                    ...mod,
                    marca_id: mod.marca_id || m.id,
                }))
            );
        }
        if (marcaId && marcaId !== 'all') {
            list = list.filter((m) => String(m.marca_id) === String(marcaId));
        }
        if (categoriaId && categoriaId !== 'all') {
            list = list.filter((m) => String(m.categoria_id) === String(categoriaId));
        }
        return list;
    }, [modelos, marcas, marcaId, categoriaId]);

    // Select2 Options (memoized)
    const statusOptions = useMemo(() => [
        { value: 'all', label: __('Todos los estados') },
        { value: 'recibido', label: '1-RECIBIDO' },
        { value: 'en_diagnostico_presupuesto', label: '2-EN DIAGNOSTICO Y PRESUPUESTO' },
        { value: 'confirmacion_presupuesto', label: '3-CONFIRMACION DE PRESUPUESTO' },
        { value: 'espera_refaccion', label: '4-ESPERA DE REFACCION' },
        { value: 'en_reparacion', label: '5-EN REPARACION' },
        { value: 'listo_reparado', label: '6-LISTO PARA ENTREGAR REPARADO' },
        { value: 'listo_sin_solucion', label: '7-LISTO PARA ENTREGAR SIN SOLUCION' },
        { value: 'entregado_finalizado', label: '8-ENTREGADO FINALIZADO' },
        { value: 'reincidencia_garantia', label: '8-REINCIDENCIA/GARANTIA' },
    ], [__]);

    const categoriaOptions = useMemo(() => [
        { value: 'all', label: __('Todas las categorías') },
        ...(categorias || []).map((c) => ({ value: String(c.id), label: c.nombre })),
    ], [categorias, __]);

    const marcaOptions = useMemo(() => [
        { value: 'all', label: __('Todas las marcas') },
        ...(marcas || []).map((m) => ({ value: String(m.id), label: m.nombre })),
    ], [marcas, __]);

    const modeloOptions = useMemo(() => [
        { value: 'all', label: __('Todos los modelos') },
        ...availableModelos.map((m: any) => ({
            value: String(m.id),
            label: m.nombre_comercial || m.nombre || 'Modelo',
            description: m.codigo_modelo || undefined,
        })),
    ], [availableModelos, __]);

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
                    marca_id: marcaId === 'all' ? undefined : marcaId,
                    modelo_id: modeloId === 'all' ? undefined : modeloId,
                    categoria_id: categoriaId === 'all' ? undefined : categoriaId,
                    perPage: perPage === '10' ? undefined : perPage,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, status, marcaId, modeloId, categoriaId, perPage]);

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

    const handleResetFilters = () => {
        setSearch('');
        setStatus('all');
        setMarcaId('all');
        setModeloId('all');
        setCategoriaId('all');
        setPerPage('10');
        router.get('/admin/reparaciones', {}, { preserveState: true, preserveScroll: true });
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
            case 'entregado_finalizado':
            case 'entregado':
                text = `✅ ¡Gracias por su preferencia *${clientName}*! Su orden *${o.numero_orden}* (*${deviceName}*) ha sido *ENTREGADA Y FINALIZADA* con éxito.\n\n🛡️ Su servicio cuenta con *${garantia} días de garantía*.\n\n📄 Puede consultar o descargar su comprobante aquí:\n${trackingUrl}\n\n¡Gracias por confiar en *${empName}*!`;
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
        switch (st) {
            case 'recibido':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        1-RECIBIDO
                    </span>
                );
            case 'en_diagnostico_presupuesto':
            case 'en_diagnostico':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        2-EN DIAGNOSTICO Y PRESUPUESTO
                    </span>
                );
            case 'confirmacion_presupuesto':
            case 'presupuestado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        3-CONFIRMACION DE PRESUPUESTO
                    </span>
                );
            case 'espera_refaccion':
            case 'esperando_repuesto':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        4-ESPERA DE REFACCION
                    </span>
                );
            case 'en_reparacion':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        5-EN REPARACION
                    </span>
                );
            case 'listo_reparado':
            case 'reparado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        6-LISTO PARA ENTREGAR REPARADO
                    </span>
                );
            case 'listo_sin_solucion':
            case 'cancelado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        7-LISTO PARA ENTREGAR SIN SOLUCION
                    </span>
                );
            case 'entregado_finalizado':
            case 'entregado':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-300"></span>
                        8-ENTREGADO FINALIZADO
                    </span>
                );
            case 'reincidencia_garantia':
            case 'reincidencia':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                        8-REINCIDENCIA/GARANTIA
                    </span>
                );
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{st?.replace(/_/g, ' ').toUpperCase()}</span>;
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

                {/* BARRA DE FILTROS ESTÁNDAR CON SELECT2 (SHADCN/UI) */}
                <FilterBar>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end w-full">
                        {/* BUSCAR */}
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Folio, Cliente, IMEI...')}
                                value={search}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const normalized = val.replace(/REP['´`]/gi, 'REP-');
                                    setSearch(normalized);
                                }}
                                className="h-9 text-xs"
                            />
                        </FilterField>

                        {/* ESTADO */}
                        <FilterField label={__('Estado')}>
                            <SearchableSelect
                                options={statusOptions}
                                value={status}
                                onChange={setStatus}
                                placeholder={__('Todos los estados')}
                                searchPlaceholder={__('Buscar estado...')}
                            />
                        </FilterField>

                        {/* CATEGORÍA */}
                        <FilterField label={__('Categoría')}>
                            <SearchableSelect
                                options={categoriaOptions}
                                value={categoriaId}
                                onChange={(val) => {
                                    setCategoriaId(val);
                                    setModeloId('all');
                                }}
                                placeholder={__('Todas las categorías')}
                                searchPlaceholder={__('Buscar categoría...')}
                            />
                        </FilterField>

                        {/* MARCA */}
                        <FilterField label={__('Marca')}>
                            <SearchableSelect
                                options={marcaOptions}
                                value={marcaId}
                                onChange={(val) => {
                                    setMarcaId(val);
                                    setModeloId('all');
                                }}
                                placeholder={__('Todas las marcas')}
                                searchPlaceholder={__('Buscar marca...')}
                            />
                        </FilterField>

                        {/* MODELO */}
                        <FilterField label={__('Modelo')}>
                            <SearchableSelect
                                options={modeloOptions}
                                value={modeloId}
                                onChange={setModeloId}
                                placeholder={__('Todos los modelos')}
                                searchPlaceholder={__('Buscar modelo...')}
                            />
                        </FilterField>

                        {/* REGISTROS POR PÁGINA */}
                        <FilterField label={__('Mostrar')}>
                            <SearchableSelect
                                options={perPageOptions}
                                value={perPage}
                                onChange={setPerPage}
                                placeholder={__('10')}
                                searchPlaceholder={__('Registros...')}
                            />
                        </FilterField>
                    </div>

                    {(search || status !== 'all' || categoriaId !== 'all' || marcaId !== 'all' || modeloId !== 'all' || perPage !== '10') && (
                        <div className="flex justify-end mt-2.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold"
                            >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                {__('Limpiar Filtros')}
                            </Button>
                        </div>
                    )}
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
                            {/* HEADER EMPRESA CON LOGO */}
                            <div className="text-center mb-1 flex flex-col items-center justify-center">
                                {empresaInfo?.logo || empresaInfo?.logo_mini ? (
                                    <img
                                        src={empresaInfo.logo || empresaInfo.logo_mini}
                                        alt={empresaInfo.razon_social || empresaInfo.nombre_comercial || 'Logo'}
                                        style={{
                                            width: `${Number(empresaInfo?.logo_ticket_size || 200)}px`,
                                            maxWidth: '100%',
                                            height: 'auto',
                                            maxHeight: '160px',
                                        }}
                                        className="mx-auto object-contain mb-1"
                                    />
                                ) : (
                                    <div className="font-black text-base uppercase tracking-tight">{empresaInfo?.nombre_comercial || empresaInfo?.razon_social || 'SERVITEC'}</div>
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
