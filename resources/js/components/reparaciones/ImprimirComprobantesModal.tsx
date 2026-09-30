import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Printer,
    Tag,
    User,
    Plus,
    Minus,
    FileText,
    Sliders,
    Smartphone,
    Type,
    Maximize2,
    Wrench,
    Check,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarcodeSVG } from '@/components/barcode-svg';
import { QRCodeSVG } from '@/components/qr-code-svg';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess } from '@/utils/notifications';

export interface ImprimirComprobantesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orden: any;
    empresa?: any;
    currencySymbol?: string;
}

export const FORMATOS_STICKER = [
    { id: '50x30', label: '50 × 30 mm (Estándar Celulares / Adhesivo)', width: 50, height: 30 },
    { id: '60x40', label: '60 × 40 mm (Mediana con Código de Barras)', width: 60, height: 40 },
    { id: '70x35', label: '70 × 35 mm (Alargada para Carcasa / Tapa)', width: 70, height: 35 },
    { id: '80x50', label: '80 × 50 mm (Grande con QR y Barras)', width: 80, height: 50 },
    { id: 'custom', label: 'Personalizado (Medidas a Medida mm)', width: 50, height: 30 },
] as const;

export const TAMANOS_LETRA = [
    { id: '7', label: '7.0px - Extra Compacta (Mucho Texto)', value: 7 },
    { id: '7.5', label: '7.5px - Micro (Ideal 50×30mm)', value: 7.5 },
    { id: '8', label: '8.0px - Fina y Nítida', value: 8 },
    { id: '8.5', label: '8.5px - Mediana Recomendada (60×40mm)', value: 8.5 },
    { id: '9', label: '9.0px - Estándar', value: 9 },
    { id: '10', label: '10.0px - Mediana Grande', value: 10 },
    { id: '11', label: '11.0px - Grande (Para 80×50mm)', value: 11 },
] as const;

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>
                GRÁFICA DEL PATRÓN DE DESBLOQUEO
            </div>
            <svg width="120" height="120" viewBox="0 0 300 300" style={{ border: '1px solid black', backgroundColor: 'white', margin: '0 auto' }}>
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
            <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '4px' }}>
                Secuencia: {pattern.join(' - ')}
            </div>
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

export default function ImprimirComprobantesModal({
    open,
    onOpenChange,
    orden,
    empresa,
    currencySymbol = '$',
}: ImprimirComprobantesModalProps) {
    if (!open || !orden) return null;

    const { __ } = useTranslate();


    // ─────────────────────────────────────────────────────────────
    // COLUMNA 1: TICKET PARA EL CLIENTE (80MM POS)
    // ─────────────────────────────────────────────────────────────
    const [copiasTicket, setCopiasTicket] = useState<number>(1);

    // ─────────────────────────────────────────────────────────────
    // COLUMNA 2: TICKET / ETIQUETA PARA TÉCNICO (PERSONALIZABLE)
    // ─────────────────────────────────────────────────────────────
    const [tipoTicketTecnico, setTipoTicketTecnico] = useState<'sticker' | 'ficha_80mm'>('sticker');
    const [copiasSticker, setCopiasSticker] = useState<number>(1);
    const [formatoStickerId, setFormatoStickerId] = useState<string>('50x30');
    const [customWidth, setCustomWidth] = useState<number>(50);
    const [customHeight, setCustomHeight] = useState<number>(30);
    const [fontSizeId, setFontSizeId] = useState<string>('8.5');

    // Switches de campos del ticket técnico / sticker
    const [showEmpresa, setShowEmpresa] = useState<boolean>(true);
    const [showNumeroOrden, setShowNumeroOrden] = useState<boolean>(true);
    const [showCliente, setShowCliente] = useState<boolean>(true);
    const [showTelefono, setShowTelefono] = useState<boolean>(true);
    const [showEquipo, setShowEquipo] = useState<boolean>(true);
    const [showPin, setShowPin] = useState<boolean>(true);
    const [showObservaciones, setShowObservaciones] = useState<boolean>(true);
    const [showFalla, setShowFalla] = useState<boolean>(true);
    const [showBarcode, setShowBarcode] = useState<boolean>(true);
    const [showQr, setShowQr] = useState<boolean>(true);
    const [showFecha, setShowFecha] = useState<boolean>(true);
    const [showTecnico, setShowTecnico] = useState<boolean>(true);

    const defaultObs = useMemo(() => {
        return (orden?.observaciones_fisicas || orden?.accesorios || '').trim();
    }, [orden?.observaciones_fisicas, orden?.accesorios]);

    const [customObsText, setCustomObsText] = useState<string>(defaultObs);
    const [labelObsTitle, setLabelObsTitle] = useState<string>('Observaciones');

    // Cargar y persistir configuración del ticket técnico en localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('fixsale_etiqueta_termica_config');
            if (saved) {
                const p = JSON.parse(saved);
                if (p.tipoTicketTecnico) setTipoTicketTecnico(p.tipoTicketTecnico);
                if (p.formatoId) setFormatoStickerId(p.formatoId);
                if (p.customWidth) setCustomWidth(p.customWidth);
                if (p.customHeight) setCustomHeight(p.customHeight);
                if (p.fontSizeId) setFontSizeId(p.fontSizeId);
                if (p.showEmpresa !== undefined) setShowEmpresa(p.showEmpresa);
                if (p.showNumeroOrden !== undefined) setShowNumeroOrden(p.showNumeroOrden);
                if (p.showCliente !== undefined) setShowCliente(p.showCliente);
                if (p.showTelefono !== undefined) setShowTelefono(p.showTelefono);
                if (p.showEquipo !== undefined) setShowEquipo(p.showEquipo);
                if (p.showPin !== undefined) setShowPin(p.showPin);
                if (p.showObservaciones !== undefined) setShowObservaciones(p.showObservaciones);
                if (p.showFalla !== undefined) setShowFalla(p.showFalla);
                if (p.showBarcode !== undefined) setShowBarcode(p.showBarcode);
                if (p.showQr !== undefined) setShowQr(p.showQr);
                if (p.showFecha !== undefined) setShowFecha(p.showFecha);
                if (p.showTecnico !== undefined) setShowTecnico(p.showTecnico);
                if (p.labelObsTitle) setLabelObsTitle(p.labelObsTitle);
            }
        } catch {}
    }, []);

    const saveStickerPreferences = () => {
        try {
            localStorage.setItem(
                'fixsale_etiqueta_termica_config',
                JSON.stringify({
                    tipoTicketTecnico,
                    formatoId: formatoStickerId,
                    customWidth,
                    customHeight,
                    fontSizeId,
                    showEmpresa,
                    showNumeroOrden,
                    showCliente,
                    showTelefono,
                    showEquipo,
                    showPin,
                    showObservaciones,
                    showFalla,
                    showBarcode,
                    showQr,
                    showFecha,
                    showTecnico,
                    labelObsTitle,
                })
            );
        } catch {}
    };

    // Dimensiones activas del sticker en milímetros
    const { stickerWidth, stickerHeight } = useMemo(() => {
        if (formatoStickerId === 'custom') {
            return {
                stickerWidth: Math.max(30, Math.min(120, customWidth || 50)),
                stickerHeight: Math.max(20, Math.min(150, customHeight || 30)),
            };
        }
        const found = FORMATOS_STICKER.find((f) => f.id === formatoStickerId);
        return {
            stickerWidth: found?.width || 50,
            stickerHeight: found?.height || 30,
        };
    }, [formatoStickerId, customWidth, customHeight]);

    // ─────────────────────────────────────────────────────────────
    // DATOS NORMALIZADOS DE LA ORDEN Y EMPRESA
    // ─────────────────────────────────────────────────────────────
    const folio = orden?.numero_orden || '000000';
    const clienteNombre = (orden?.cliente?.nombre || orden?.cliente_nombre || 'Cliente General').trim();
    const clienteTelefono = (orden?.cliente?.telefono || orden?.cliente_telefono || '').trim();
    const marcaNombre = (orden?.marca?.nombre || orden?.marca_nombre || '').trim();
    const modeloNombre = (orden?.modelo?.nombre_comercial || orden?.modelo_nombre || '').trim();
    const equipoDisplay = [marcaNombre, modeloNombre].filter(Boolean).join(' ') || orden?.tipo_dispositivo || 'Equipo';

    const rawContrasena = String(orden?.contrasena_patron || '').trim();
    const pinDisplay = useMemo(() => {
        if (!rawContrasena || rawContrasena.toLowerCase().includes('sin contraseña') || rawContrasena.toLowerCase().includes('sin contrasena')) {
            return '';
        }
        return rawContrasena.replace(/^PIN\/Clave:\s*/i, '').replace(/^PIN:\s*/i, '').trim();
    }, [rawContrasena]);

    const fallaDisplay = (orden?.descripcion_falla || (orden?.items && orden?.items.length > 0 ? orden.items.map((i: any) => i.descripcion || i.servicio?.nombre || i.producto?.nombre).join(', ') : 'Revisión y diagnóstico')).trim();
    const obsDisplay = customObsText || defaultObs;

    const empresaInfo = empresa || orden?.empresa;
    const empresaNombreDisplay = (
        empresaInfo?.nombre_comercial ||
        empresaInfo?.razon_social ||
        empresaInfo?.nombre ||
        'SERVITEC'
    ).trim();

    const tecnicoNombre = (orden?.tecnico?.name || orden?.tecnico?.nombre || '').trim();

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

    const fechaCortaDisplay = useMemo(() => {
        if (!orden?.fecha_recepcion && !orden?.created_at) return '';
        try {
            const d = new Date(orden.fecha_recepcion || orden.created_at);
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        } catch {
            return '';
        }
    }, [orden?.fecha_recepcion, orden?.created_at]);

    const trackingUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const empId = orden?.empresa_id || empresaInfo?.id || 1;
        return `${window.location.origin}/reparacion/${empId}/consultar?orden=${folio}`;
    }, [orden?.empresa_id, empresaInfo?.id, folio]);

    // Estado de destino activo de impresión nativa (para evitar que Chromium aísle iframes y use tamaño Carta)
    const [activePrintTarget, setActivePrintTarget] = useState<'cliente' | 'tecnico_sticker' | 'tecnico_ficha' | null>(null);
    const [isPrintingBoth, setIsPrintingBoth] = useState<boolean>(false);

    // Escuchar el evento nativo afterprint del navegador para limpiar estilos o encadenar impresión
    useEffect(() => {
        const handleAfterPrint = () => {
            if (isPrintingBoth) {
                setIsPrintingBoth(false);
                setTimeout(() => {
                    setActivePrintTarget(tipoTicketTecnico === 'sticker' ? 'tecnico_sticker' : 'tecnico_ficha');
                    setTimeout(() => {
                        window.print();
                    }, 250);
                }, 350);
            } else {
                setActivePrintTarget(null);
            }
        };

        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [isPrintingBoth, tipoTicketTecnico]);

    // Auto-guardado en caliente de preferencias en localStorage
    useEffect(() => {
        saveStickerPreferences();
    }, [
        tipoTicketTecnico,
        formatoStickerId,
        customWidth,
        customHeight,
        fontSizeId,
        showEmpresa,
        showNumeroOrden,
        showCliente,
        showTelefono,
        showEquipo,
        showPin,
        showObservaciones,
        showFalla,
        showBarcode,
        showQr,
        showFecha,
        showTecnico,
        labelObsTitle,
    ]);

    const handlePrintClientTicket = () => {
        saveStickerPreferences();
        setActivePrintTarget('cliente');
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handlePrintSticker = () => {
        saveStickerPreferences();
        setActivePrintTarget(tipoTicketTecnico === 'sticker' ? 'tecnico_sticker' : 'tecnico_ficha');
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handlePrintBoth = () => {
        saveStickerPreferences();
        setIsPrintingBoth(true);
        setActivePrintTarget('cliente');
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // ─────────────────────────────────────────────────────────────
    // RENDERIZADO DEL TICKET DE CLIENTE (OFICIAL 80MM POS)
    // ─────────────────────────────────────────────────────────────
    const renderTicketClienteContent = (isForPrint = false) => (
        <div style={{ fontFamily: 'Courier New, Courier, monospace, Arial, sans-serif', color: '#000000', fontSize: '11px', lineHeight: 1.25, padding: isForPrint ? '0' : '12px', background: '#ffffff', userSelect: 'none' }}>
            {/* HEADER EMPRESA CON LOGO */}
            <div style={{ textAlign: 'center', marginBottom: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {empresaInfo?.logo || empresaInfo?.logo_mini ? (
                    <img
                        src={empresaInfo.logo || empresaInfo.logo_mini}
                        alt={empresaInfo.razon_social || empresaInfo.nombre_comercial || 'Logo'}
                        style={{
                            width: `${Number(empresaInfo?.logo_ticket_size || 200)}px`,
                            maxWidth: '100%',
                            height: 'auto',
                            maxHeight: '160px',
                            margin: '0 auto 4px auto',
                            objectFit: 'contain',
                        }}
                    />
                ) : (
                    <div style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        {empresaNombreDisplay}
                    </div>
                )}
            </div>

            {/* DIRECCIÓN Y TELÉFONO CENTRADOS */}
            {empresaInfo?.direccion && (
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', padding: '0 4px', lineHeight: 1.2 }}>
                    {empresaInfo.direccion}
                </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px', marginTop: '2px' }}>
                TEL: {empresaInfo?.telefono || empresaInfo?.whatsapp_phone || 'S/T'}
            </div>

            {/* BANNER NEGRO ORDEN N° */}
            <div style={{ background: '#000000', color: '#ffffff', textAlign: 'center', fontWeight: 900, fontSize: '13px', padding: '4px 0', margin: '8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ORDEN N° {orden.numero_orden}
            </div>

            {/* DATOS DEL CLIENTE */}
            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                DATOS DEL CLIENTE
            </div>
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: 'bold', textTransform: 'uppercase', padding: '0 4px' }}>
                <div>NOMBRE: <span style={{ fontWeight: 'normal' }}>{clienteNombre}</span></div>
                <div>TELEFONO: <span style={{ fontWeight: 'normal' }}>{clienteTelefono || '-'}</span></div>
            </div>

            {/* DATOS DEL EQUIPO */}
            <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', marginTop: '10px', marginBottom: '4px' }}>
                DATOS DEL EQUIPO
            </div>
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: 'bold', textTransform: 'uppercase', padding: '0 4px' }}>
                <div>EQUIPO: <span style={{ fontWeight: 'normal' }}>{equipoDisplay}</span></div>
                <div>IMEI/SN: <span style={{ fontWeight: 'normal' }}>{orden.imei_serie || 'nv'}</span></div>
                <div>OBSERVACIONES: <span style={{ fontWeight: 'normal' }}>{orden.observaciones_fisicas || 'equipo sin observaciones'}</span></div>
                <div>REPARACION: <span style={{ fontWeight: 'normal' }}>{fallaDisplay}</span></div>
                <div>ACCESORIOS: <span style={{ fontWeight: 'normal' }}>{orden.accesorios_incluidos || 'no deja'}</span></div>
            </div>

            {/* BANNER COSTO REPARACION */}
            <div style={{ background: '#000000', color: '#ffffff', textAlign: 'center', fontWeight: 900, fontSize: '10px', padding: '3px 0', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                COSTO REPARACION
            </div>
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SUBTOTAL =</span>
                    <span>${formatNum(orden.costo_estimado)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ANTICIPO =</span>
                    <span>${formatNum(orden.anticipo)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #000000', paddingTop: '2px', fontWeight: 900 }}>
                    <span>TOTAL =</span>
                    <span>${formatNum(orden.saldo_restante)} {currencySymbol !== '$' ? currencySymbol : 'MXN'}</span>
                </div>
            </div>

            {/* BANNER FECHA DE RECEPCION */}
            <div style={{ background: '#000000', color: '#ffffff', textAlign: 'center', fontWeight: 900, fontSize: '10px', padding: '3px 0', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                FECHA DE RECEPCION
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: '3px 0' }}>
                {formatDate(orden.fecha_recepcion)}
            </div>

            {/* BANNER FECHA APROX DE ENTREGA */}
            <div style={{ background: '#000000', color: '#ffffff', textAlign: 'center', fontWeight: 900, fontSize: '10px', padding: '3px 0', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                FECHA APROX DE ENTREGA
            </div>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', padding: '3px 0' }}>
                {formatFullSpanishDate(orden.fecha_estimada_entrega || orden.fecha_prometida || orden.fecha_recepcion)}
            </div>

            {/* BANNER CONTRASEÑA */}
            <div style={{ background: '#000000', color: '#ffffff', textAlign: 'center', fontWeight: 900, fontSize: '10px', padding: '3px 0', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CONTRASEÑA
            </div>
            <div style={{ padding: '6px 0' }}>
                {extractPatternNumbers(orden.contrasena_patron).length > 0 ? (
                    <PrintablePatternLock pattern={extractPatternNumbers(orden.contrasena_patron)} />
                ) : (
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', padding: '4px 0' }}>
                        {orden.contrasena_patron || 'Sin contraseña'}
                    </div>
                )}
            </div>

            {/* TÉCNICO ASIGNADO */}
            {tecnicoNombre && (
                <div style={{ borderTop: '1px dashed #000000', marginTop: '6px', paddingTop: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '8.5px', textTransform: 'uppercase', fontWeight: 'bold', color: '#4b5563' }}>TÉCNICO ASIGNADO:</div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>{tecnicoNombre}</div>
                </div>
            )}

            {/* CÓDIGO DE BARRAS */}
            <div style={{ textAlign: 'center', padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '240px', overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                    <BarcodeSVG
                        value={orden.numero_orden}
                        width={1.6}
                        height={46}
                        displayValue={false}
                    />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.05em' }}>
                    CÓDIGO DE REPARACIÓN: {orden.numero_orden}
                </div>
                <div style={{ fontSize: '7.5px', color: '#374151', fontWeight: 600 }}>
                    Escanee el código para consultar estado o cobrar en POS
                </div>
            </div>

            {/* TÉRMINOS Y FIRMA */}
            <div style={{ paddingTop: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'left', marginBottom: '4px' }}>
                    Términos y Condiciones de Garantía:
                </div>
                <div style={{ border: '2px solid #000000', height: '46px', width: '100%', marginBottom: '4px', background: '#ffffff' }}></div>
                <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}>
                    FIRMA DE CONFORMIDAD
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // RENDERIZADO DEL TICKET PARA TÉCNICO / TALLER (PERSONALIZABLE)
    // ─────────────────────────────────────────────────────────────
    const renderTicketTecnicoContent = (isForPrint = false) => {
        if (tipoTicketTecnico === 'ficha_80mm') {
            // Formato Ficha de Trabajo Taller en 80mm
            return (
                <div style={{ fontFamily: 'Courier New, Courier, monospace, Arial, sans-serif', color: '#000000', fontSize: '10.5px', lineHeight: 1.25, padding: isForPrint ? '0' : '12px', background: '#ffffff', userSelect: 'none' }}>
                    <div style={{ textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontSize: '11.5px', background: '#000000', color: '#ffffff', padding: '3px 0' }}>
                        FICHA DE TRABAJO TÉCNICO DE TALLER
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '6px' }}>
                        <span>ORDEN: <strong>{orden.numero_orden}</strong></span>
                        <span>RECIBIDO: <strong>{formatDate(orden.fecha_recepcion)}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                        <span>CLIENTE: <strong>{clienteNombre}</strong></span>
                        <span>TEL: <strong>{clienteTelefono}</strong></span>
                    </div>
                    <div style={{ borderBottom: '1px solid #000000', margin: '4px 0' }}></div>

                    <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div>EQUIPO: <strong>{equipoDisplay}</strong></div>
                        <div>IMEI/SERIE: <strong>{orden.imei_serie || 'nv'}</strong></div>
                        <div>ENTREGA ESTIMADA: <strong>{formatDate(orden.fecha_prometida || orden.fecha_estimada_entrega) || 'No especificada'}</strong></div>
                        <div>FALLA REPORTADA: <strong>{fallaDisplay}</strong></div>
                        <div>DETALLE TALLER / OBS: <strong>{obsDisplay || 'Sin observaciones'}</strong></div>
                        <div>SEGURIDAD / PIN: <strong>{pinDisplay || orden.contrasena_patron || 'Sin contraseña'}</strong></div>
                        {tecnicoNombre && <div>TÉCNICO ASIGNADO: <strong>{tecnicoNombre}</strong></div>}
                    </div>

                    {extractPatternNumbers(orden.contrasena_patron).length > 0 && (
                        <div style={{ margin: '6px 0' }}>
                            <PrintablePatternLock pattern={extractPatternNumbers(orden.contrasena_patron)} />
                        </div>
                    )}

                    <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>

                    <div style={{ textAlign: 'center', padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '240px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                            <BarcodeSVG
                                value={orden.numero_orden}
                                width={1.5}
                                height={42}
                                displayValue={false}
                            />
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' }}>
                            CÓDIGO DE REPARACIÓN: {orden.numero_orden}
                        </div>
                    </div>
                </div>
            );
        }

        // Formato Sticker Adhesivo Físico (Estilo Imagen 2)
        const isSmallLabel = stickerHeight <= 32 || stickerWidth <= 50;
        const fontPx = parseFloat(fontSizeId) || (isSmallLabel ? 7.5 : 8.5);
        const paddingMm = isSmallLabel ? '1.2mm 1.8mm' : '1.8mm 2.2mm';

        return (
            <div
                style={{
                    width: `${stickerWidth}mm`,
                    height: `${stickerHeight}mm`,
                    maxHeight: `${stickerHeight}mm`,
                    padding: paddingMm,
                    fontSize: `${fontPx}px`,
                    lineHeight: '1.14',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    border: '1px solid #000000',
                    boxSizing: 'border-box',
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ overflow: 'hidden' }}>
                    {/* CABECERA: EMPRESA Y REPARACIÓN N° */}
                    {(showEmpresa || showNumeroOrden) && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: '1.5px',
                                marginBottom: '2px',
                                borderBottom: '1px solid #000000',
                                gap: '4px',
                            }}
                        >
                            {showEmpresa && (
                                <span
                                    style={{
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        fontSize: `${fontPx + 1}px`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '55%',
                                    }}
                                >
                                    {empresaNombreDisplay}
                                </span>
                            )}
                            {showNumeroOrden && (
                                <span
                                    style={{
                                        fontWeight: 900,
                                        fontSize: `${fontPx + 1}px`,
                                        marginLeft: 'auto',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Reparación N° {folio}
                                </span>
                            )}
                        </div>
                    )}

                    {/* FILAS DE INFORMACIÓN TÉCNICA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {showCliente && (
                            <div style={{ wordBreak: 'break-word' }}>
                                <strong>Cliente: </strong>
                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{clienteNombre}</span>
                            </div>
                        )}

                        {showTelefono && clienteTelefono && (
                            <div>
                                <strong>Teléfono: </strong>
                                <span style={{ fontFamily: 'monospace' }}>{clienteTelefono}</span>
                            </div>
                        )}

                        {(showEquipo || (showPin && pinDisplay)) && (
                            <div style={{ wordBreak: 'break-word' }}>
                                {showEquipo && (
                                    <>
                                        <strong>Marca: </strong>
                                        <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{equipoDisplay}</span>
                                    </>
                                )}
                                {showPin && pinDisplay && (
                                    <>
                                        <strong>{pinDisplay.toLowerCase().startsWith('patrón') || pinDisplay.toLowerCase().startsWith('patron') ? ' | ' : ' | PIN: '}</strong>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#f1f5f9', padding: '0 2px', whiteSpace: 'nowrap' }}>
                                            {pinDisplay}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {showObservaciones && obsDisplay && (
                            <div style={{ wordBreak: 'break-word' }}>
                                <strong>{labelObsTitle}: </strong>
                                <span style={{ textTransform: 'uppercase' }}>{obsDisplay}</span>
                            </div>
                        )}

                        {showFalla && fallaDisplay && (
                            <div style={{ wordBreak: 'break-word' }}>
                                <strong>Falla: </strong>
                                <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{fallaDisplay}</span>
                            </div>
                        )}

                        {showFecha && fechaCortaDisplay && (
                            <div>
                                <strong>Recibido: </strong>
                                <span>{fechaCortaDisplay}</span>
                            </div>
                        )}

                        {showTecnico && tecnicoNombre && (
                            <div style={{ wordBreak: 'break-word' }}>
                                <strong>Técnico: </strong>
                                <span>{tecnicoNombre}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CÓDIGO DE BARRAS / QR INFERIOR */}
                {(showBarcode || showQr) && (
                    <div
                        style={{
                            marginTop: '1px',
                            paddingTop: '2px',
                            borderTop: '1px dashed rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}
                    >
                        {showBarcode && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <div style={{ transform: isSmallLabel ? 'scale(0.85)' : 'scale(0.92)', transformOrigin: 'center', maxHeight: isSmallLabel ? '15px' : '20px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                                    <BarcodeSVG
                                        value={folio}
                                        width={isSmallLabel ? 0.9 : 1.1}
                                        height={isSmallLabel ? 14 : 18}
                                        displayValue={false}
                                    />
                                </div>
                                <span style={{ fontSize: '6px', fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1, marginTop: '1px' }}>{folio}</span>
                            </div>
                        )}

                        {showQr && (
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QRCodeSVG value={trackingUrl} size={isSmallLabel ? 22 : 28} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* =========================================================================
                PORTAL DE IMPRESIÓN NATIVO EN EL DOCUMENTO PRINCIPAL
                (Garantiza que Chromium adopte el tamaño @page exacto y NO hoja Carta)
                ========================================================================= */}
            {activePrintTarget === 'cliente' && (
                <div id="fixsale-active-print-zone" className="hidden print:block">
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
                            #fixsale-active-print-zone, #fixsale-active-print-zone * {
                                visibility: visible !important;
                            }
                            #fixsale-active-print-zone {
                                display: block !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 80mm !important;
                                max-width: 80mm !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .fixsale-ticket-copy-page {
                                width: 80mm !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                margin: 0 !important;
                                padding: 2mm !important;
                                box-sizing: border-box !important;
                            }
                            @page {
                                size: 80mm auto !important;
                                margin: 0mm !important;
                            }
                        }
                    `}</style>
                    {Array.from({ length: Math.max(1, copiasTicket) }).map((_, idx) => (
                        <div key={`client-ticket-copy-${idx}`} className="fixsale-ticket-copy-page">
                            {renderTicketClienteContent(true)}
                        </div>
                    ))}
                </div>
            )}

            {activePrintTarget === 'tecnico_sticker' && (
                <div id="fixsale-active-print-zone" className="hidden print:block">
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
                            #fixsale-active-print-zone, #fixsale-active-print-zone * {
                                visibility: visible !important;
                            }
                            #fixsale-active-print-zone {
                                display: block !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: ${stickerWidth}mm !important;
                                max-width: ${stickerWidth}mm !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .fixsale-sticker-copy-page {
                                width: ${stickerWidth}mm !important;
                                height: ${stickerHeight}mm !important;
                                max-height: ${stickerHeight}mm !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                box-sizing: border-box !important;
                                overflow: hidden !important;
                                display: flex !important;
                                flex-direction: column !important;
                            }
                            @page {
                                size: ${stickerWidth}mm ${stickerHeight}mm !important;
                                margin: 0mm !important;
                            }
                        }
                    `}</style>
                    {Array.from({ length: Math.max(1, copiasSticker) }).map((_, idx) => (
                        <div key={`sticker-copy-${idx}`} className="fixsale-sticker-copy-page">
                            {renderTicketTecnicoContent(true)}
                        </div>
                    ))}
                </div>
            )}

            {activePrintTarget === 'tecnico_ficha' && (
                <div id="fixsale-active-print-zone" className="hidden print:block">
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
                            #fixsale-active-print-zone, #fixsale-active-print-zone * {
                                visibility: visible !important;
                            }
                            #fixsale-active-print-zone {
                                display: block !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 80mm !important;
                                max-width: 80mm !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .fixsale-ficha-copy-page {
                                width: 80mm !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                margin: 0 !important;
                                padding: 2mm !important;
                                box-sizing: border-box !important;
                            }
                            @page {
                                size: 80mm auto !important;
                                margin: 0mm !important;
                            }
                        }
                    `}</style>
                    {Array.from({ length: Math.max(1, copiasSticker) }).map((_, idx) => (
                        <div key={`ficha-copy-${idx}`} className="fixsale-ficha-copy-page">
                            {renderTicketTecnicoContent(true)}
                        </div>
                    ))}
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VENTANA MODAL UNIFICADA: COL-6 (CLIENTE) Y COL-6 (TÉCNICO)
                ───────────────────────────────────────────────────────────── */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-6xl max-h-[94vh] overflow-y-auto p-5 sm:p-7 rounded-3xl">
                    <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Printer className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                                    {__('Imprimir Comprobantes de Reparación')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                    {__('Ticket para el cliente (80mm) y comprobante personalizable para el técnico en una sola ventana.')}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* GRID PRINCIPAL DE 2 COLUMNAS (COL-6 Y COL-6) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                        {/* ═════════════════════════════════════════════════════════════
                            COLUMNA 1 (COL-6): TICKET PARA EL CLIENTE (80MM POS)
                            ═════════════════════════════════════════════════════════════ */}
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                            <div className="space-y-4">
                                {/* CABECERA DE LA COLUMNA 1 */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                                {__('1. Ticket para el Cliente')}
                                            </h4>
                                            <p className="text-[10.5px] text-slate-500">
                                                {__('Comprobante oficial de entrega (80mm POS)')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5">
                                        80mm POS
                                    </Badge>
                                </div>

                                {/* COPIAS A IMPRIMIR */}
                                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {__('Copias del Ticket:')}
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCopiasTicket((p) => Math.max(1, p - 1))}
                                            disabled={copiasTicket <= 1}
                                            className="h-8 w-8 rounded-lg"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="w-8 text-center font-bold text-xs font-mono">
                                            {copiasTicket}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCopiasTicket((p) => Math.min(20, p + 1))}
                                            className="h-8 w-8 rounded-lg"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* VISTA PREVIA DEL TICKET (SIMULADA 80MM) */}
                                <div className="space-y-1">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                        {__('VISTA PREVIA TICKET CLIENTE (80MM)')}
                                    </span>
                                    <div className="p-3 sm:p-4 bg-slate-200/80 dark:bg-slate-950 rounded-2xl flex justify-center max-h-[420px] overflow-y-auto shadow-inner border border-slate-300 dark:border-slate-800">
                                        <div className="w-[300px] shadow-lg rounded-sm border border-slate-300 bg-white">
                                            {renderTicketClienteContent(false)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN IMPRIMIR TICKET */}
                            <Button
                                type="button"
                                onClick={() => handlePrintClientTicket()}
                                className="w-full h-11 gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-900/20"
                            >
                                <Printer className="w-4 h-4" />
                                {copiasTicket === 1
                                    ? __('Imprimir Ticket de Cliente')
                                    : __('Imprimir :count Tickets de Cliente', { count: copiasTicket })}
                            </Button>
                        </div>

                        {/* ═════════════════════════════════════════════════════════════
                            COLUMNA 2 (COL-6): TICKET / ETIQUETA PARA TÉCNICO
                            ═════════════════════════════════════════════════════════════ */}
                        <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60">
                            <div className="space-y-4">
                                {/* CABECERA DE LA COLUMNA 2 */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-900/60 gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                                {__('2. Ticket para Técnico / Taller')}
                                            </h4>
                                            <p className="text-[10.5px] text-slate-500">
                                                {tipoTicketTecnico === 'sticker'
                                                    ? __('Sticker adhesivo troquelado para pegar en equipo')
                                                    : __('Ficha técnica de trabajo en rollo térmico 80mm')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SELECTOR DE MODO: STICKER VS FICHA 80MM */}
                                    <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-indigo-200 dark:border-slate-800 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => setTipoTicketTecnico('sticker')}
                                            className={cn(
                                                'px-2.5 py-1 rounded-md font-bold transition-all',
                                                tipoTicketTecnico === 'sticker'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                                            )}
                                        >
                                            🏷️ Sticker
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTipoTicketTecnico('ficha_80mm')}
                                            className={cn(
                                                'px-2.5 py-1 rounded-md font-bold transition-all',
                                                tipoTicketTecnico === 'ficha_80mm'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                                            )}
                                        >
                                            📄 Ficha 80mm
                                        </button>
                                    </div>
                                </div>

                                {/* CONTROLES DE FORMATO, TIPOGRAFÍA Y COPIAS */}
                                <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800">
                                    {tipoTicketTecnico === 'sticker' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {/* FORMATO MEDIDAS */}
                                            <div className="space-y-1">
                                                <Label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <Maximize2 className="w-3 h-3 text-indigo-500" />
                                                    {__('Medidas:')}
                                                </Label>
                                                <Select value={formatoStickerId} onValueChange={setFormatoStickerId}>
                                                    <SelectTrigger className="h-8 text-xs font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FORMATOS_STICKER.map((f) => (
                                                            <SelectItem key={f.id} value={f.id} className="text-xs">
                                                                {f.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* TAMAÑO DE FUENTE */}
                                            <div className="space-y-1">
                                                <Label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                    <Type className="w-3 h-3 text-indigo-500" />
                                                    {__('Tamaño Letra:')}
                                                </Label>
                                                <Select value={fontSizeId} onValueChange={setFontSizeId}>
                                                    <SelectTrigger className="h-8 text-xs font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TAMANOS_LETRA.map((t) => (
                                                            <SelectItem key={t.id} value={t.id} className="text-xs">
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* COPIAS */}
                                            <div className="space-y-1">
                                                <Label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                                                    {__('Copias:')}
                                                </Label>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setCopiasSticker((p) => Math.max(1, p - 1))}
                                                        disabled={copiasSticker <= 1}
                                                        className="h-8 w-8 rounded-lg"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-7 text-center font-bold text-xs font-mono">
                                                        {copiasSticker}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setCopiasSticker((p) => Math.min(50, p + 1))}
                                                        className="h-8 w-8 rounded-lg"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* MEDIDAS MANUALES MM */}
                                            {formatoStickerId === 'custom' && (
                                                <div className="sm:col-span-3 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Ancho (mm):</span>
                                                        <Input
                                                            type="number"
                                                            min="30"
                                                            max="120"
                                                            value={customWidth}
                                                            onChange={(e) => setCustomWidth(parseInt(e.target.value) || 50)}
                                                            className="h-7 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Alto (mm):</span>
                                                        <Input
                                                            type="number"
                                                            min="20"
                                                            max="150"
                                                            value={customHeight}
                                                            onChange={(e) => setCustomHeight(parseInt(e.target.value) || 30)}
                                                            className="h-7 text-xs font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {tipoTicketTecnico === 'ficha_80mm' && (
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {__('Copias de la Ficha Técnica:')}
                                            </Label>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setCopiasSticker((p) => Math.max(1, p - 1))}
                                                    disabled={copiasSticker <= 1}
                                                    className="h-8 w-8 rounded-lg"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-8 text-center font-bold text-xs font-mono">
                                                    {copiasSticker}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setCopiasSticker((p) => Math.min(20, p + 1))}
                                                    className="h-8 w-8 rounded-lg"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SWITCHES DE CONTENIDO PERSONALIZABLES (SOLO MODO STICKER) */}
                                {tipoTicketTecnico === 'sticker' && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                            {__('CAMPOS PERSONALIZADOS VISIBLES EN EL STICKER')}
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-800 text-[11px]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Empresa</span>
                                                <Switch checked={showEmpresa} onCheckedChange={setShowEmpresa} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">N° Folio</span>
                                                <Switch checked={showNumeroOrden} onCheckedChange={setShowNumeroOrden} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Cliente</span>
                                                <Switch checked={showCliente} onCheckedChange={setShowCliente} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Teléfono</span>
                                                <Switch checked={showTelefono} onCheckedChange={setShowTelefono} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Equipo</span>
                                                <Switch checked={showEquipo} onCheckedChange={setShowEquipo} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">PIN/Clave</span>
                                                <Switch checked={showPin} onCheckedChange={setShowPin} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Observación</span>
                                                <Switch checked={showObservaciones} onCheckedChange={setShowObservaciones} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Falla</span>
                                                <Switch checked={showFalla} onCheckedChange={setShowFalla} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Recibido</span>
                                                <Switch checked={showFecha} onCheckedChange={setShowFecha} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Técnico</span>
                                                <Switch checked={showTecnico} onCheckedChange={setShowTecnico} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Cód. Barras</span>
                                                <Switch checked={showBarcode} onCheckedChange={setShowBarcode} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-300 font-medium">Cód. QR</span>
                                                <Switch checked={showQr} onCheckedChange={setShowQr} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* NOTA EDITABLE RÁPIDA (EN VIVO ANTES DE IMPRIMIR) */}
                                {tipoTicketTecnico === 'sticker' && showObservaciones && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setLabelObsTitle(labelObsTitle === 'Accesorios' ? 'Observaciones' : labelObsTitle === 'Observaciones' ? 'Falla' : labelObsTitle === 'Falla' ? 'Detalle' : 'Accesorios')}
                                            className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0"
                                            title="Click para cambiar etiqueta de campo"
                                        >
                                            {labelObsTitle}:
                                        </button>
                                        <Input
                                            value={customObsText}
                                            onChange={(e) => setCustomObsText(e.target.value)}
                                            placeholder="Detalle editable en vivo para el sticker..."
                                            className="h-7 text-[11px] font-mono"
                                        />
                                    </div>
                                )}

                                {/* VISTA PREVIA DEL TICKET / STICKER TÉCNICO */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                            {tipoTicketTecnico === 'sticker'
                                                ? `VISTA PREVIA STICKER (${stickerWidth} × ${stickerHeight} MM)`
                                                : `VISTA PREVIA FICHA TALLER (80MM)`}
                                        </span>
                                        {tipoTicketTecnico === 'sticker' && (
                                            <span className="text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                                Letra: {fontSizeId}px
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4 bg-slate-200/80 dark:bg-slate-950 rounded-2xl flex items-center justify-center shadow-inner border border-slate-300 dark:border-slate-800 min-h-[200px] max-h-[420px] overflow-auto">
                                        {tipoTicketTecnico === 'sticker' ? (
                                            <div
                                                className="bg-white shadow-xl transition-all border border-slate-300"
                                                style={{
                                                    transform: stickerWidth <= 55 ? 'scale(1.25)' : stickerWidth <= 70 ? 'scale(1.15)' : 'scale(1.0)',
                                                    transformOrigin: 'center center',
                                                    margin: '12px auto',
                                                }}
                                            >
                                                {renderTicketTecnicoContent(false)}
                                            </div>
                                        ) : (
                                            <div className="w-[300px] bg-white shadow-lg">
                                                {renderTicketTecnicoContent(false)}
                                            </div>
                                        )}
                                    </div>

                                    {/* CONSEJO DE IMPRESIÓN */}
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 p-2.5 rounded-xl flex items-center gap-2 leading-tight">
                                        <span className="text-xs shrink-0">💡</span>
                                        <span>{__('En la ventana de impresión del navegador, asegúrate de tener Márgenes: "Ninguno" (None) y Escala: 100% para respetar las medidas exactas del papel.')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN IMPRIMIR TÉCNICO */}
                            <Button
                                type="button"
                                onClick={() => handlePrintSticker()}
                                className="w-full h-11 gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-900/20"
                            >
                                <Tag className="w-4 h-4" />
                                {tipoTicketTecnico === 'sticker'
                                    ? copiasSticker === 1
                                        ? __('Imprimir Etiqueta Sticker (:width × :height mm)', { width: stickerWidth, height: stickerHeight })
                                        : __('Imprimir :count Stickers (:width × :height mm)', { count: copiasSticker, width: stickerWidth, height: stickerHeight })
                                    : copiasSticker === 1
                                        ? __('Imprimir Ficha de Taller (80mm)')
                                        : __('Imprimir :count Fichas de Taller', { count: copiasSticker })}
                            </Button>
                        </div>
                    </div>

                    {/* FOOTER DEL MODAL */}
                    <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-10 px-5 text-xs font-semibold w-full sm:w-auto"
                        >
                            {__('Cerrar')}
                        </Button>

                        <Button
                            type="button"
                            onClick={handlePrintBoth}
                            className="h-10 px-6 gap-2 text-xs font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-950/30 rounded-xl w-full sm:w-auto"
                        >
                            <Printer className="w-4 h-4" />
                            {__('🖨️ Imprimir Ambos (Cliente + Técnico)')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
