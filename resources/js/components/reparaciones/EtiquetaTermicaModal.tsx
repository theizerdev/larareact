import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Printer,
    Tag,
    X,
    Plus,
    Minus,
    Sliders,
    Sparkles,
    Check,
    RotateCcw,
    Smartphone,
    User,
    Phone,
    Shield,
    FileText,
    QrCode,
    Barcode as BarcodeIcon,
    Building2,
    Calendar,
    Wrench,
    RotateCw,
    ArrowLeftRight,
    Maximize2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

export interface EtiquetaTermicaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orden: any;
    empresa?: any;
    onAfterPrint?: () => void;
}

// Formatos estándar de etiquetas térmicas troqueladas (en milímetros)
export const FORMATOS_ETIQUETA = [
    { id: '50x30', label: '50 × 30 mm (Estándar Laptops / Celulares)', width: 50, height: 30 },
    { id: '60x40', label: '60 × 40 mm (Mediana con Código de Barras)', width: 60, height: 40 },
    { id: '70x35', label: '70 × 35 mm (Alargada)', width: 70, height: 35 },
    { id: '80x50', label: '80 × 50 mm (Grande con QR)', width: 80, height: 50 },
    { id: '30x50', label: '30 × 50 mm (Vertical / Retrato)', width: 30, height: 50 },
    { id: '40x60', label: '40 × 60 mm (Vertical Mediana)', width: 40, height: 60 },
    { id: 'custom', label: 'Personalizado (Medidas a Medida)', width: 50, height: 30 },
] as const;

export const ORIENTACIONES_ETIQUETA = [
    { id: 'horizontal', label: 'Horizontal / Paisaje (Normal)' },
    { id: 'vertical', label: 'Vertical / Retrato' },
    { id: 'rotado_90', label: 'Rotado 90° (Horario)' },
    { id: 'rotado_180', label: 'Rotado 180° (Invertido)' },
    { id: 'rotado_270', label: 'Rotado 270° (Antihorario)' },
] as const;

/**
 * Impresión aislada mediante iframe oculto para evitar
 * el bug de 24 páginas y los pies de página de Chrome con URL.
 */
function printViaIframe(
    contentHtml: string,
    pageWidthMm: number,
    pageHeightMm: number,
    copies: number = 1,
    rotationDeg: number = 0,
    docTitle: string = 'Etiqueta_Termica'
) {
    const existing = document.getElementById('fixsale-etiqueta-print-iframe');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'fixsale-etiqueta-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    let pagesHtml = '';
    const numCopies = Math.max(1, copies);
    for (let i = 0; i < numCopies; i++) {
        pagesHtml += `<div class="thermal-print-page">${contentHtml}</div>`;
    }

    let rotationCss = '';
    if (rotationDeg === 90) {
        rotationCss = `
            .thermal-print-page > div {
                transform: rotate(90deg) translateY(-${pageWidthMm}mm) !important;
                transform-origin: top left !important;
            }
        `;
    } else if (rotationDeg === 180) {
        rotationCss = `
            .thermal-print-page > div {
                transform: rotate(180deg) !important;
                transform-origin: center center !important;
            }
        `;
    } else if (rotationDeg === 270) {
        rotationCss = `
            .thermal-print-page > div {
                transform: rotate(270deg) translateX(-${pageHeightMm}mm) !important;
                transform-origin: top left !important;
            }
        `;
    }

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${docTitle}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: ${pageWidthMm}mm !important;
        }
        @page {
            size: ${pageWidthMm}mm ${pageHeightMm}mm !important;
            margin: 0mm !important;
        }
        @media print {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
            }
            .thermal-print-page {
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .thermal-print-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
            }
        }
        .thermal-print-page {
            width: ${pageWidthMm}mm;
            height: ${pageHeightMm}mm;
            max-height: ${pageHeightMm}mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: stretch;
            align-items: stretch;
            position: relative;
        }
        ${rotationCss}
    </style>
</head>
<body>
    ${pagesHtml}
</body>
</html>`;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    const doPrint = () => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (err) {
            console.error('[Etiqueta Print Error]', err);
        }
    };

    const images = iframe.contentDocument?.images;
    if (images && images.length > 0) {
        let loaded = 0;
        let triggered = false;
        const checkDone = () => {
            if (!triggered) {
                triggered = true;
                setTimeout(doPrint, 100);
            }
        };
        for (let i = 0; i < images.length; i++) {
            if (images[i].complete) {
                loaded++;
            } else {
                images[i].onload = () => {
                    loaded++;
                    if (loaded >= images.length) checkDone();
                };
                images[i].onerror = () => {
                    loaded++;
                    if (loaded >= images.length) checkDone();
                };
            }
        }
        if (loaded >= images.length) {
            setTimeout(checkDone, 100);
        } else {
            setTimeout(checkDone, 700);
        }
    } else {
        setTimeout(doPrint, 150);
    }
}

export default function EtiquetaTermicaModal({
    open,
    onOpenChange,
    orden,
    empresa,
    onAfterPrint,
}: EtiquetaTermicaModalProps) {
    if (!open) return null;

    const { __ } = useTranslate();

    // 1. Configuración de copias y formato
    const [copias, setCopias] = useState<number>(1);
    const [formatoId, setFormatoId] = useState<string>('50x30');
    const [orientacion, setOrientacion] = useState<'horizontal' | 'vertical' | 'rotado_90' | 'rotado_180' | 'rotado_270'>('horizontal');
    const [customWidth, setCustomWidth] = useState<number>(50);
    const [customHeight, setCustomHeight] = useState<number>(30);

    // 2. Interruptores de contenido (Toggles)
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

    // Texto personalizable para la línea de notas / accesorios
    const defaultObs = useMemo(() => {
        return (orden?.observaciones_fisicas || orden?.accesorios || '').trim();
    }, [orden?.observaciones_fisicas, orden?.accesorios]);

    const [customObsText, setCustomObsText] = useState<string>('');
    const [labelObsTitle, setLabelObsTitle] = useState<string>('Observaciones');

    // Cargar preferencias guardadas en localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('fixsale_etiqueta_termica_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.formatoId) setFormatoId(parsed.formatoId);
                if (parsed.orientacionSticker) setOrientacion(parsed.orientacionSticker);
                if (parsed.customWidth) setCustomWidth(parsed.customWidth);
                if (parsed.customHeight) setCustomHeight(parsed.customHeight);
                if (parsed.showEmpresa !== undefined) setShowEmpresa(parsed.showEmpresa);
                if (parsed.showNumeroOrden !== undefined) setShowNumeroOrden(parsed.showNumeroOrden);
                if (parsed.showCliente !== undefined) setShowCliente(parsed.showCliente);
                if (parsed.showTelefono !== undefined) setShowTelefono(parsed.showTelefono);
                if (parsed.showEquipo !== undefined) setShowEquipo(parsed.showEquipo);
                if (parsed.showPin !== undefined) setShowPin(parsed.showPin);
                if (parsed.showObservaciones !== undefined) setShowObservaciones(parsed.showObservaciones);
                if (parsed.showFalla !== undefined) setShowFalla(parsed.showFalla);
                if (parsed.showBarcode !== undefined) setShowBarcode(parsed.showBarcode);
                if (parsed.showQr !== undefined) setShowQr(parsed.showQr);
                if (parsed.showFecha !== undefined) setShowFecha(parsed.showFecha);
                if (parsed.showTecnico !== undefined) setShowTecnico(parsed.showTecnico);
                if (parsed.labelObsTitle) setLabelObsTitle(parsed.labelObsTitle);
            }
        } catch {
            // Ignorar errores de parsing
        }
    }, []);

    // Sincronizar texto de observaciones por defecto cuando cambia la orden
    useEffect(() => {
        setCustomObsText(defaultObs);
    }, [defaultObs]);

    // Guardar preferencias en localStorage cuando cambien
    const savePreferences = () => {
        try {
            localStorage.setItem(
                'fixsale_etiqueta_termica_config',
                JSON.stringify({
                    formatoId,
                    orientacionSticker: orientacion,
                    customWidth,
                    customHeight,
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

    useEffect(() => {
        savePreferences();
    }, [
        formatoId,
        orientacion,
        customWidth,
        customHeight,
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

    // Calcular medidas activas en mm
    const { activeWidth, activeHeight } = useMemo(() => {
        if (formatoId === 'custom') {
            return {
                activeWidth: Math.max(25, Math.min(150, customWidth || 50)),
                activeHeight: Math.max(20, Math.min(150, customHeight || 30)),
            };
        }
        const found = FORMATOS_ETIQUETA.find((f) => f.id === formatoId);
        return {
            activeWidth: found?.width || 50,
            activeHeight: found?.height || 30,
        };
    }, [formatoId, customWidth, customHeight]);

    // Invertir medidas (Ancho ↔ Alto)
    const handleSwapDimensions = () => {
        const newW = activeHeight;
        const newH = activeWidth;
        setFormatoId('custom');
        setCustomWidth(newW);
        setCustomHeight(newH);
    };

    // Parámetros de impresión según orientación
    const printParams = useMemo(() => {
        if (orientacion === 'rotado_90') {
            return {
                pageWidthMm: activeHeight,
                pageHeightMm: activeWidth,
                rotationDeg: 90,
            };
        }
        if (orientacion === 'rotado_270') {
            return {
                pageWidthMm: activeHeight,
                pageHeightMm: activeWidth,
                rotationDeg: 270,
            };
        }
        if (orientacion === 'rotado_180') {
            return {
                pageWidthMm: activeWidth,
                pageHeightMm: activeHeight,
                rotationDeg: 180,
            };
        }
        return {
            pageWidthMm: activeWidth,
            pageHeightMm: activeHeight,
            rotationDeg: 0,
        };
    }, [activeWidth, activeHeight, orientacion]);

    // Datos normalizados
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

    const fechaDisplay = useMemo(() => {
        if (!orden?.fecha_recepcion && !orden?.created_at) return '';
        try {
            const d = new Date(orden.fecha_recepcion || orden.created_at);
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        } catch {
            return '';
        }
    }, [orden?.fecha_recepcion, orden?.created_at]);

    // URL de seguimiento para QR
    const trackingUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const empId = orden?.empresa_id || empresa?.id || 1;
        return `${window.location.origin}/reparacion/${empId}/consultar?orden=${folio}`;
    }, [orden?.empresa_id, empresa?.id, folio]);

    // Acción de Impresión
    const handlePrint = () => {
        savePreferences();
        const container = document.getElementById('fixsale-etiqueta-render-zone');
        if (!container) return;

        printViaIframe(
            container.innerHTML,
            printParams.pageWidthMm,
            printParams.pageHeightMm,
            copias,
            printParams.rotationDeg,
            `Etiqueta_${folio}`
        );

        if (onAfterPrint) {
            onAfterPrint();
        }
    };

    // Componente interno del sticker físico compacto
    const renderStickerLabel = (isForPrint = false) => {
        const isSmallLabel = activeHeight <= 35 || activeWidth <= 50;

        return (
            <div
                className={cn(
                    'relative bg-white text-black font-sans box-border select-none border border-black',
                    isForPrint ? 'w-full h-full' : 'shadow-md rounded-none'
                )}
                style={{
                    width: isForPrint ? `${activeWidth}mm` : '100%',
                    height: isForPrint ? `${activeHeight}mm` : 'auto',
                    maxHeight: isForPrint ? `${activeHeight}mm` : 'none',
                    padding: isSmallLabel ? '1mm 1.5mm' : '2mm 2.5mm',
                    fontSize: isSmallLabel ? '7.2px' : '9px',
                    lineHeight: '1.12',
                    overflow: 'hidden',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                }}
            >
                <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.5px' }}>
                    {/* CABECERA: EMPRESA Y REPARACIÓN N° */}
                    {(showEmpresa || showNumeroOrden) && (
                        <div className="flex items-center justify-between pb-0.5 mb-0.5 border-b border-black overflow-hidden gap-1">
                            {showEmpresa && (
                                <span className="font-extrabold uppercase tracking-tight text-[8px] sm:text-[9.5px] truncate max-w-[55%]">
                                    {empresaNombreDisplay}
                                </span>
                            )}
                            {showNumeroOrden && (
                                <span className="font-black text-right text-[8px] sm:text-[9.5px] tracking-tight ml-auto whitespace-nowrap">
                                    Rep. N° {folio}
                                </span>
                            )}
                        </div>
                    )}

                    {/* FILAS DE INFORMACIÓN TÉCNICA */}
                    {showCliente && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span className="font-bold">Cliente: </span>
                            <span className="uppercase font-semibold">{clienteNombre}</span>
                            {showTelefono && clienteTelefono && (
                                <>
                                    <span className="font-bold" style={{ marginLeft: '3px' }}>| Tel: </span>
                                    <span className="font-medium font-mono">{clienteTelefono}</span>
                                </>
                            )}
                        </div>
                    )}

                    {!showCliente && showTelefono && clienteTelefono && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span className="font-bold">Tel: </span>
                            <span className="font-medium font-mono">{clienteTelefono}</span>
                        </div>
                    )}

                    {(showEquipo || (showPin && pinDisplay)) && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {showEquipo && (
                                <>
                                    <span className="font-bold">Marca: </span>
                                    <span className="uppercase font-semibold">{equipoDisplay}</span>
                                </>
                            )}
                            {showPin && pinDisplay && (
                                <>
                                    <span className="font-bold" style={{ marginLeft: showEquipo ? '3px' : '0' }}>| PIN: </span>
                                    <span className="font-mono font-bold bg-slate-100 px-0.5">{pinDisplay}</span>
                                </>
                            )}
                        </div>
                    )}

                    {showObservaciones && obsDisplay && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span className="font-bold">{labelObsTitle}: </span>
                            <span className="uppercase">{obsDisplay}</span>
                        </div>
                    )}

                    {showFalla && fallaDisplay && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span className="font-bold">Falla: </span>
                            <span className="uppercase font-bold">{fallaDisplay}</span>
                        </div>
                    )}

                    {((showFecha && fechaDisplay) || (showTecnico && tecnicoNombre)) && (
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {showFecha && fechaDisplay && (
                                <>
                                    <span className="font-bold">Rec: </span>
                                    <span>{fechaDisplay}</span>
                                </>
                            )}
                            {showTecnico && tecnicoNombre && (
                                <>
                                    <span className="font-bold" style={{ marginLeft: showFecha && fechaDisplay ? '4px' : '0' }}>| Téc: </span>
                                    <span>{tecnicoNombre}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* CÓDIGO DE BARRAS / QR INFERIOR */}
                {(showBarcode || showQr) && (
                    <div
                        style={{
                            marginTop: 'auto',
                            paddingTop: '1px',
                            borderTop: '1px dashed rgba(0,0,0,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '2px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            maxHeight: isSmallLabel ? '24px' : '32px',
                        }}
                    >
                        {showBarcode && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <div style={{ maxHeight: isSmallLabel ? '13px' : '18px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                                    <BarcodeSVG
                                        value={folio}
                                        width={isSmallLabel ? 0.85 : 1.1}
                                        height={isSmallLabel ? 12 : 16}
                                        displayValue={false}
                                    />
                                </div>
                                <span style={{ fontSize: '5.5px', fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1, marginTop: '0.5px' }}>{folio}</span>
                            </div>
                        )}

                        {showQr && (
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QRCodeSVG value={trackingUrl} size={isSmallLabel ? 20 : 26} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* CONTENEDOR OCULTO PARA CAPTURA DOM DE IFRAME */}
            <div
                style={{
                    position: 'fixed',
                    left: '-9999px',
                    top: '-9999px',
                    width: '1px',
                    height: '1px',
                    opacity: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
                aria-hidden="true"
            >
                <div id="fixsale-etiqueta-render-zone">
                    {renderStickerLabel(true)}
                </div>
            </div>

            {/* MODAL DIALOG PRINCIPAL */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
                    <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-base font-extrabold tracking-tight">
                                    {__('Imprimir Etiqueta Térmica para Equipo')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                    {__('Genera stickers autoadhesivos con orientación configurable para cualquier rollo térmico.')}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2 space-y-3.5 text-xs">
                        {/* FILA 1: COPIAS, FORMATO Y ORIENTACIÓN */}
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                {/* FORMATO */}
                                <div className="sm:col-span-6 space-y-1">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {__('Medidas Etiqueta:')}
                                    </Label>
                                    <Select value={formatoId} onValueChange={setFormatoId}>
                                        <SelectTrigger className="h-8 text-xs font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FORMATOS_ETIQUETA.map((f) => (
                                                <SelectItem key={f.id} value={f.id} className="text-xs">
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* ORIENTACIÓN */}
                                <div className="sm:col-span-4 space-y-1">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <RotateCw className="w-3 h-3 text-indigo-500" />
                                        {__('Orientación:')}
                                    </Label>
                                    <Select value={orientacion} onValueChange={(v: any) => setOrientacion(v)}>
                                        <SelectTrigger className="h-8 text-xs font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORIENTACIONES_ETIQUETA.map((o) => (
                                                <SelectItem key={o.id} value={o.id} className="text-xs">
                                                    {o.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* BOTÓN INVERTIR */}
                                <div className="sm:col-span-2 flex items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSwapDimensions}
                                        className="h-8 w-full text-[10px] font-bold border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 gap-1 px-1"
                                        title="Invertir Ancho ↔ Alto"
                                    >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        {__('Invertir')}
                                    </Button>
                                </div>
                            </div>

                            {/* COPIAS */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Copias a Imprimir:')}
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCopias((prev) => Math.max(1, prev - 1))}
                                        disabled={copias <= 1}
                                        className="h-8 w-8 rounded-lg"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center font-bold text-xs font-mono">
                                        {copias}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCopias((prev) => Math.min(50, prev + 1))}
                                        className="h-8 w-8 rounded-lg"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* CAMPOS PERSONALIZADOS SI SELECCIONA CUSTOM */}
                            {formatoId === 'custom' && (
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-[10px] text-slate-500 font-bold block mb-0.5">{__('Ancho (mm)')}</Label>
                                        <Input
                                            type="number"
                                            min="20"
                                            max="150"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(parseInt(e.target.value) || 50)}
                                            className="h-7 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-500 font-bold block mb-0.5">{__('Alto (mm)')}</Label>
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

                        {/* TOGGLES DE CONTENIDO */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                {__('CAMPOS VISIBLES EN EL STICKER')}
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                                <div className="flex items-center justify-between">
                                    <span>Empresa</span>
                                    <Switch checked={showEmpresa} onCheckedChange={setShowEmpresa} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>N° Orden</span>
                                    <Switch checked={showNumeroOrden} onCheckedChange={setShowNumeroOrden} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Cliente</span>
                                    <Switch checked={showCliente} onCheckedChange={setShowCliente} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Teléfono</span>
                                    <Switch checked={showTelefono} onCheckedChange={setShowTelefono} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Equipo</span>
                                    <Switch checked={showEquipo} onCheckedChange={setShowEquipo} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>PIN/Clave</span>
                                    <Switch checked={showPin} onCheckedChange={setShowPin} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Observaciones</span>
                                    <Switch checked={showObservaciones} onCheckedChange={setShowObservaciones} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Falla</span>
                                    <Switch checked={showFalla} onCheckedChange={setShowFalla} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Recibido</span>
                                    <Switch checked={showFecha} onCheckedChange={setShowFecha} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Técnico</span>
                                    <Switch checked={showTecnico} onCheckedChange={setShowTecnico} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Cód. Barras</span>
                                    <Switch checked={showBarcode} onCheckedChange={setShowBarcode} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Cód. QR</span>
                                    <Switch checked={showQr} onCheckedChange={setShowQr} />
                                </div>
                            </div>
                        </div>

                        {/* NOTA RÁPIDA */}
                        {showObservaciones && (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setLabelObsTitle(labelObsTitle === 'Observaciones' ? 'Accesorios' : labelObsTitle === 'Accesorios' ? 'Falla' : 'Observaciones')}
                                    className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] shrink-0"
                                >
                                    {labelObsTitle}:
                                </button>
                                <Input
                                    value={customObsText}
                                    onChange={(e) => setCustomObsText(e.target.value)}
                                    placeholder={__('Detalle editable en vivo...')}
                                    className="h-7 text-xs font-mono"
                                />
                            </div>
                        )}

                        {/* VISTA PREVIA CON ROTACIÓN */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    {__('VISTA PREVIA')} ({activeWidth} × {activeHeight} MM)
                                </span>
                                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                    Salida: {printParams.pageWidthMm}×{printParams.pageHeightMm} mm
                                </span>
                            </div>

                            <div className="p-4 bg-slate-100 dark:bg-slate-950/70 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden min-h-[170px]">
                                <div
                                    className="bg-white shadow-lg transition-all border border-slate-300"
                                    style={{
                                        width: `${activeWidth}mm`,
                                        height: `${activeHeight}mm`,
                                        transform: orientacion === 'rotado_90'
                                            ? 'rotate(90deg)'
                                            : orientacion === 'rotado_180'
                                            ? 'rotate(180deg)'
                                            : orientacion === 'rotado_270'
                                            ? 'rotate(270deg)'
                                            : activeWidth <= 55 ? 'scale(1.15)' : 'scale(1.0)',
                                        transformOrigin: 'center center',
                                        margin: orientacion === 'rotado_90' || orientacion === 'rotado_270' ? '20px auto' : '6px auto',
                                    }}
                                >
                                    {renderStickerLabel(false)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-10 px-4 text-xs font-semibold"
                        >
                            {__('Cancelar')}
                        </Button>

                        <Button
                            type="button"
                            onClick={handlePrint}
                            className="h-10 px-5 gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-950/30 rounded-xl transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            {copias === 1
                                ? __('Imprimir 1 Etiqueta (:w × :h mm)', { w: printParams.pageWidthMm, h: printParams.pageHeightMm })
                                : __('Imprimir :count Etiquetas (:w × :h mm)', { count: copias, w: printParams.pageWidthMm, h: printParams.pageHeightMm })}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
