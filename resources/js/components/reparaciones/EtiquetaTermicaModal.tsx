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
    { id: '58xauto', label: '58 mm Continuo (Impresora POS Pequeña)', width: 54, height: 45 },
    { id: '80xauto', label: '80 mm Continuo (Impresora POS Estándar)', width: 74, height: 55 },
    { id: 'custom', label: 'Personalizado (Medidas a Medida)', width: 50, height: 30 },
] as const;

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
    const [showBarcode, setShowBarcode] = useState<boolean>(false);
    const [showQr, setShowQr] = useState<boolean>(false);
    const [showFecha, setShowFecha] = useState<boolean>(false);
    const [showTecnico, setShowTecnico] = useState<boolean>(false);

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
        } catch {
            // Ignorar
        }
    };

    // Calcular dimensiones activas en milímetros
    const { activeWidth, activeHeight } = useMemo(() => {
        if (formatoId === 'custom') {
            return {
                activeWidth: Math.max(30, Math.min(120, customWidth || 50)),
                activeHeight: Math.max(20, Math.min(150, customHeight || 30)),
            };
        }
        const found = FORMATOS_ETIQUETA.find((f) => f.id === formatoId);
        return {
            activeWidth: found?.width || 50,
            activeHeight: found?.height || 30,
        };
    }, [formatoId, customWidth, customHeight]);

    // Datos extraídos de la orden
    const folio = orden?.numero_orden || '000000';
    const clienteNombre = (orden?.cliente?.nombre || orden?.cliente_nombre || 'Cliente General').trim();
    const clienteTelefono = (orden?.cliente?.telefono || orden?.cliente_telefono || '').trim();
    const marcaNombre = (orden?.marca?.nombre || orden?.marca_nombre || '').trim();
    const modeloNombre = (orden?.modelo?.nombre_comercial || orden?.modelo_nombre || '').trim();
    const equipoDisplay = [marcaNombre, modeloNombre].filter(Boolean).join(' - ') || orden?.tipo_dispositivo || 'Equipo';

    // Extracción de PIN / Contraseña limpia
    const rawContrasena = String(orden?.contrasena_patron || '').trim();
    const pinDisplay = useMemo(() => {
        if (!rawContrasena || rawContrasena.toLowerCase().includes('sin contraseña') || rawContrasena.toLowerCase().includes('sin contrasena')) {
            return '';
        }
        // Si viene con prefijo PIN/Clave: extraemos solo el valor
        return rawContrasena.replace(/^PIN\/Clave:\s*/i, '').replace(/^PIN:\s*/i, '').trim();
    }, [rawContrasena]);

    const fallaDisplay = (orden?.descripcion_falla || 'Revisión técnica').trim();
    const obsDisplay = customObsText || defaultObs;

    const empresaNombreDisplay = (
        empresa?.nombre_comercial ||
        empresa?.nombre ||
        empresa?.razon_social ||
        'CONSUME'
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
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        savePreferences();
        setIsPrinting(true);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                setIsPrinting(false);
                if (onAfterPrint) onAfterPrint();
            }, 500);
        }, 150);
    };

    // Componente interno del sticker físico (reproduce la estética de la Imagen 2)
    const renderStickerLabel = (isForPrint = false) => {
        // En etiquetas pequeñas (ej 50x30mm), ajustar tamaño de fuente para evitar desbordes
        const isSmallLabel = activeHeight <= 32 || activeWidth <= 50;

        return (
            <div
                className={cn(
                    'relative bg-white text-black font-sans box-border select-none border border-black',
                    isForPrint ? 'w-full h-full' : 'shadow-md rounded-none'
                )}
                style={{
                    width: isForPrint ? `${activeWidth}mm` : '100%',
                    height: isForPrint ? `${activeHeight}mm` : 'auto',
                    minHeight: isForPrint ? `${activeHeight}mm` : '170px',
                    padding: isSmallLabel ? '1.5mm 2mm' : '2.5mm 3mm',
                    fontSize: isSmallLabel ? '8px' : '9.5px',
                    lineHeight: '1.18',
                    overflow: 'hidden',
                    letterSpacing: '-0.02em',
                }}
            >
                {/* CABECERA: EMPRESA (IZQ) Y REPARACIÓN N° (DER) CON LÍNEA DIVISORIA */}
                {(showEmpresa || showNumeroOrden) && (
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-black">
                        {showEmpresa && (
                            <span className="font-extrabold uppercase tracking-tight text-[10px] sm:text-[11px] truncate max-w-[55%]">
                                {empresaNombreDisplay}
                            </span>
                        )}
                        {showNumeroOrden && (
                            <span className="font-black text-right text-[10px] sm:text-[11px] tracking-tight ml-auto whitespace-nowrap">
                                Reparación N° {folio}
                            </span>
                        )}
                    </div>
                )}

                {/* FILAS DE INFORMACIÓN TÉCNICA (ESTILO IMAGEN 2) */}
                <div className="space-y-[1.5px] font-sans">
                    {showCliente && (
                        <div className="truncate">
                            <span className="font-bold">Cliente: </span>
                            <span className="uppercase font-semibold">{clienteNombre}</span>
                        </div>
                    )}

                    {showTelefono && clienteTelefono && (
                        <div>
                            <span className="font-bold">Teléfono: </span>
                            <span className="font-medium font-mono">{clienteTelefono}</span>
                        </div>
                    )}

                    {(showEquipo || (showPin && pinDisplay)) && (
                        <div className="truncate">
                            {showEquipo && (
                                <>
                                    <span className="font-bold">Marca: </span>
                                    <span className="uppercase font-semibold">{equipoDisplay}</span>
                                </>
                            )}
                            {showPin && pinDisplay && (
                                <>
                                    <span className="font-bold"> | PIN: </span>
                                    <span className="font-mono font-bold bg-slate-100 px-0.5">{pinDisplay}</span>
                                </>
                            )}
                        </div>
                    )}

                    {showObservaciones && obsDisplay && (
                        <div className="truncate">
                            <span className="font-bold">{labelObsTitle}: </span>
                            <span className="uppercase">{obsDisplay}</span>
                        </div>
                    )}

                    {showFalla && (
                        <div className="line-clamp-2">
                            <span className="font-bold">Falla: </span>
                            <span className="uppercase font-bold">{fallaDisplay}</span>
                        </div>
                    )}

                    {showFecha && fechaDisplay && (
                        <div>
                            <span className="font-bold">Recibido: </span>
                            <span>{fechaDisplay}</span>
                        </div>
                    )}

                    {showTecnico && tecnicoNombre && (
                        <div className="truncate">
                            <span className="font-bold">Técnico: </span>
                            <span>{tecnicoNombre}</span>
                        </div>
                    )}
                </div>

                {/* CÓDIGO DE BARRAS O QR INFERIOR (SI SE ACTIVA) */}
                {(showBarcode || showQr) && (
                    <div className="mt-1 pt-0.5 border-t border-dashed border-black/40 flex items-center justify-between gap-1 overflow-hidden">
                        {showBarcode && (
                            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                                <div className="max-w-full overflow-hidden flex justify-center scale-90 origin-center">
                                    <BarcodeSVG
                                        value={folio}
                                        width={isSmallLabel ? 1.0 : 1.3}
                                        height={isSmallLabel ? 18 : 24}
                                        displayValue={false}
                                    />
                                </div>
                                <span className="text-[6.5px] font-mono font-bold leading-none">{folio}</span>
                            </div>
                        )}

                        {showQr && (
                            <div className="flex-shrink-0 flex items-center justify-center">
                                <QRCodeSVG value={trackingUrl} size={isSmallLabel ? 26 : 34} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* ESTILOS DE IMPRESIÓN Y CONTENEDOR OCULTO SOLO ACTIVOS DURANTE LA IMPRESIÓN DE LA ETIQUETA */}
            {isPrinting && (
                <>
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
                            #thermal-label-print-zone, #thermal-label-print-zone * {
                                visibility: visible !important;
                            }
                            #thermal-label-print-zone {
                                display: block !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: ${activeWidth}mm !important;
                                background: white !important;
                            }
                            .thermal-sticker-page {
                                width: ${activeWidth}mm !important;
                                height: ${activeHeight}mm !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                box-sizing: border-box !important;
                                display: flex !important;
                                align-items: stretch !important;
                                justify-content: stretch !important;
                            }
                            @page {
                                size: ${activeWidth}mm ${activeHeight}mm !important;
                                margin: 0mm !important;
                            }
                        }
                    `}</style>

                    <div id="thermal-label-print-zone" className="hidden print:block">
                        {Array.from({ length: Math.max(1, copias) }).map((_, idx) => (
                            <div key={`sticker-copy-${idx}`} className="thermal-sticker-page">
                                {renderStickerLabel(true)}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* MODAL DIALOG PRINCIPAL (EXPERIENCIA IMAGEN 1) */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl">
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
                                    {__('Genera stickers autoadhesivos para soporte técnico y control del equipo.')}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-3 space-y-4 text-xs">
                        {/* FILA 1: COPIAS Y FORMATO DE ETIQUETA */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {/* COPIAS A IMPRIMIR */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Copias a Imprimir')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCopias((prev) => Math.max(1, prev - 1))}
                                        disabled={copias <= 1}
                                        className="h-9 w-9 rounded-lg"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </Button>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={copias}
                                        onChange={(e) => setCopias(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="h-9 text-center font-bold text-sm w-20"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCopias((prev) => Math.min(50, prev + 1))}
                                        className="h-9 w-9 rounded-lg"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* FORMATO DE ETIQUETA */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {__('Formato Etiqueta')}
                                </Label>
                                <Select value={formatoId} onValueChange={setFormatoId}>
                                    <SelectTrigger className="h-9 text-xs font-semibold">
                                        <SelectValue placeholder={__('Selecciona formato')} />
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

                            {/* CAMPOS PERSONALIZADOS SI SELECCIONA CUSTOM */}
                            {formatoId === 'custom' && (
                                <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">{__('Ancho (mm)')}</Label>
                                        <Input
                                            type="number"
                                            min="30"
                                            max="120"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(parseInt(e.target.value) || 50)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-slate-500">{__('Alto (mm)')}</Label>
                                        <Input
                                            type="number"
                                            min="20"
                                            max="150"
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(parseInt(e.target.value) || 30)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FILA 2: INTERRUPTORES DE CONTENIDO (SWITCHES ESTILO IMAGEN 1) */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                {__('Campos visibles en el sticker')}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                {/* Nombre Empresa */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowEmpresa(!showEmpresa)}>
                                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{__('Nombre Empresa')}</span>
                                    </Label>
                                    <Switch checked={showEmpresa} onCheckedChange={setShowEmpresa} />
                                </div>

                                {/* N° de Reparación */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowNumeroOrden(!showNumeroOrden)}>
                                        <Tag className="w-3.5 h-3.5 text-purple-500" />
                                        <span>{__('N° Reparación / Folio')}</span>
                                    </Label>
                                    <Switch checked={showNumeroOrden} onCheckedChange={setShowNumeroOrden} />
                                </div>

                                {/* Nombre del Cliente */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowCliente(!showCliente)}>
                                        <User className="w-3.5 h-3.5 text-blue-500" />
                                        <span>{__('Nombre del Cliente')}</span>
                                    </Label>
                                    <Switch checked={showCliente} onCheckedChange={setShowCliente} />
                                </div>

                                {/* Teléfono */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowTelefono(!showTelefono)}>
                                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{__('Teléfono de Contacto')}</span>
                                    </Label>
                                    <Switch checked={showTelefono} onCheckedChange={setShowTelefono} />
                                </div>

                                {/* Equipo (Marca / Modelo) */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowEquipo(!showEquipo)}>
                                        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{__('Marca y Modelo')}</span>
                                    </Label>
                                    <Switch checked={showEquipo} onCheckedChange={setShowEquipo} />
                                </div>

                                {/* PIN / Contraseña */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowPin(!showPin)}>
                                        <Shield className="w-3.5 h-3.5 text-rose-500" />
                                        <span>{__('PIN / Contraseña')}</span>
                                    </Label>
                                    <Switch checked={showPin} onCheckedChange={setShowPin} />
                                </div>

                                {/* Observaciones / Accesorios */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowObservaciones(!showObservaciones)}>
                                        <FileText className="w-3.5 h-3.5 text-cyan-500" />
                                        <span>{__('Observaciones / Accesorios')}</span>
                                    </Label>
                                    <Switch checked={showObservaciones} onCheckedChange={setShowObservaciones} />
                                </div>

                                {/* Falla Reportada */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowFalla(!showFalla)}>
                                        <Wrench className="w-3.5 h-3.5 text-orange-500" />
                                        <span>{__('Falla Reportada')}</span>
                                    </Label>
                                    <Switch checked={showFalla} onCheckedChange={setShowFalla} />
                                </div>

                                {/* Código de Barras */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowBarcode(!showBarcode)}>
                                        <BarcodeIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                        <span>{__('Código de Barras')}</span>
                                    </Label>
                                    <Switch checked={showBarcode} onCheckedChange={setShowBarcode} />
                                </div>

                                {/* Código QR */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowQr(!showQr)}>
                                        <QrCode className="w-3.5 h-3.5 text-purple-600" />
                                        <span>{__('Código QR')}</span>
                                    </Label>
                                    <Switch checked={showQr} onCheckedChange={setShowQr} />
                                </div>

                                {/* Fecha de Ingreso */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowFecha(!showFecha)}>
                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{__('Fecha de Ingreso')}</span>
                                    </Label>
                                    <Switch checked={showFecha} onCheckedChange={setShowFecha} />
                                </div>

                                {/* Técnico Asignado */}
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs cursor-pointer flex items-center gap-1.5" onClick={() => setShowTecnico(!showTecnico)}>
                                        <User className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>{__('Técnico Asignado')}</span>
                                    </Label>
                                    <Switch checked={showTecnico} onCheckedChange={setShowTecnico} />
                                </div>
                            </div>
                        </div>

                        {/* EDICIÓN RÁPIDA DE TEXTO DE OBSERVACIONES SI ESTÁ ACTIVO */}
                        {showObservaciones && (
                            <div className="space-y-1 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                        {__('Texto de Observaciones / Accesorios:')}
                                    </Label>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setLabelObsTitle('Accesorios')}
                                            className={cn(
                                                'px-1.5 py-0.5 text-[9px] rounded font-bold transition-all',
                                                labelObsTitle === 'Accesorios' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
                                            )}
                                        >
                                            Accesorios
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLabelObsTitle('Observaciones')}
                                            className={cn(
                                                'px-1.5 py-0.5 text-[9px] rounded font-bold transition-all',
                                                labelObsTitle === 'Observaciones' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
                                            )}
                                        >
                                            Observaciones
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLabelObsTitle('Sentimientos')}
                                            className={cn(
                                                'px-1.5 py-0.5 text-[9px] rounded font-bold transition-all',
                                                labelObsTitle === 'Sentimientos' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'
                                            )}
                                        >
                                            Sentimientos
                                        </button>
                                    </div>
                                </div>
                                <Input
                                    value={customObsText}
                                    onChange={(e) => setCustomObsText(e.target.value)}
                                    placeholder={__('Ej. CON CARGADOR, DETALLE EN BISEL, etc.')}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>
                        )}

                        {/* VISTA PREVIA EN VIVO (VISTA PREVIA ESTILO IMAGEN 1 & 2) */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    {__('VISTA PREVIA')} ({activeWidth} × {activeHeight} MM)
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {copias} {copias === 1 ? __('etiqueta') : __('etiquetas')}
                                </span>
                            </div>

                            {/* CONTENEDOR DE LA VISTA PREVIA SIMULADA */}
                            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/70 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                                <div
                                    className="w-full transition-all duration-200"
                                    style={{
                                        maxWidth: `${Math.min(420, activeWidth * 7)}px`,
                                    }}
                                >
                                    {renderStickerLabel(false)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER CON BOTONES CANCELAR E IMPRIMIR */}
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
                            disabled={isPrinting}
                            className="h-10 px-5 gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-950/30 rounded-xl transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            {copias === 1
                                ? __('Imprimir 1 Etiqueta')
                                : __('Imprimir :count Etiquetas', { count: copias })}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
