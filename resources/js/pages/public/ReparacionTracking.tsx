import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Search,
    Wrench,
    CheckCircle2,
    Clock,
    AlertCircle,
    Smartphone,
    ShieldCheck,
    Calendar,
    DollarSign,
    Check,
    X,
    MessageCircle,
    Printer,
    ArrowRight,
    Sparkles,
    Phone,
    MapPin,
    ChevronRight,
    Info,
    Layers,
    Shield,
    RotateCcw,
    Laptop,
    Tablet,
    HelpCircle,
    UserCheck,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface HistorialItem {
    id: number;
    estado_nuevo: string;
    comentario: string;
    created_at: string;
}

interface ServicioItem {
    id: number;
    descripcion: string;
    precio: number;
    tipo: string;
}

interface EmpresaInfo {
    nombre: string;
    razon_social?: string;
    logo?: string;
    direccion?: string;
    telefono?: string;
    whatsapp_phone?: string;
    email?: string;
}

interface OrdenData {
    id: number;
    numero_orden: string;
    estado_orden: string;
    tipo_dispositivo: string;
    marca_nombre: string;
    modelo_nombre: string;
    color?: string;
    imei_enmascarado?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    costo_estimado: number;
    anticipo: number;
    saldo_restante: number;
    garantia_dias: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
    fecha_entrega?: string;
    cliente_nombre_enmascarado: string;
    cliente_telefono_enmascarado?: string;
    servicios: ServicioItem[];
    historial: HistorialItem[];
    empresa: EmpresaInfo;
}

interface Props {
    orden: OrdenData | null;
    searchedCode: string;
    notFound: boolean;
    currencySymbol: string;
    defaultEmpresa: EmpresaInfo | null;
}

const MILESTONES = [
    { key: 'recibido', label: 'Recibido', desc: 'Equipo recibido en recepción' },
    { key: 'en_diagnostico', label: 'En Diagnóstico', desc: 'Evaluación técnica de fallas' },
    { key: 'presupuestado', label: 'Presupuestado', desc: 'Presupuesto listo' },
    { key: 'en_reparacion', label: 'En Reparación', desc: 'Intervención en taller' },
    { key: 'reparado', label: 'Listo / Reparado', desc: 'Superó control de calidad' },
    { key: 'entregado', label: 'Entregado', desc: 'Equipo entregado con garantía' },
];

const ORDER_STATE_RANK: Record<string, number> = {
    recibido: 1,
    en_diagnostico: 2,
    presupuestado: 3,
    esperando_repuesto: 3.5,
    en_reparacion: 4,
    reparado: 5,
    entregado: 6,
    cancelado: 0,
};

export default function ReparacionTracking({
    orden,
    searchedCode = '',
    notFound = false,
    currencySymbol = '$',
    defaultEmpresa
}: Props) {
    const [searchQuery, setSearchQuery] = useState(searchedCode || '');
    const [isSubmittingSearch, setIsSubmittingSearch] = useState(false);

    // Modal de presupuesto
    const [budgetActionModal, setBudgetActionModal] = useState<'aprobar' | 'rechazar' | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

    const activeEmpresa = orden?.empresa || defaultEmpresa;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const code = searchQuery.trim();
        if (!code) return;

        setIsSubmittingSearch(true);
        router.get('/reparacion/consultar', { orden: code }, {
            preserveState: false,
            onFinish: () => setIsSubmittingSearch(false),
        });
    };

    const handleBudgetDecision = (decision: 'aprobar' | 'rechazar') => {
        if (!orden) return;
        setIsSubmittingDecision(true);
        router.post(
            `/reparacion/consultar/${orden.numero_orden}/presupuesto`,
            {
                decision,
                motivo: decision === 'rechazar' ? rejectReason : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBudgetActionModal(null);
                    setRejectReason('');
                },
                onFinish: () => setIsSubmittingDecision(false),
            }
        );
    };

    const currentRank = orden ? (ORDER_STATE_RANK[orden.estado_orden] ?? 1) : 0;
    const isCancelled = orden?.estado_orden === 'cancelado';
    const isBudgetPending = orden?.estado_orden === 'presupuestado';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Pendiente';
        try {
            return new Date(dateStr).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const getDeviceIcon = (tipo: string = '') => {
        const lower = tipo.toLowerCase();
        if (lower.includes('laptop') || lower.includes('computadora') || lower.includes('pc')) {
            return <Laptop className="w-5 h-5" />;
        }
        if (lower.includes('tablet') || lower.includes('ipad')) {
            return <Tablet className="w-5 h-5" />;
        }
        return <Smartphone className="w-5 h-5" />;
    };

    const whatsappContactUrl = (orden && activeEmpresa?.whatsapp_phone)
        ? `https://wa.me/${activeEmpresa.whatsapp_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `Hola, me comunico respecto a mi orden de reparación ${orden.numero_orden} (${orden.marca_nombre} ${orden.modelo_nombre}).`
        )}`
        : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
            <Head title={orden ? `Orden ${orden.numero_orden} | Seguimiento en Vivo` : 'Consultar Estado de Reparación'} />

            {/* BARRA DE NAVEGACIÓN SUPERIOR */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {activeEmpresa?.logo ? (
                            <img
                                src={activeEmpresa.logo}
                                alt={activeEmpresa.nombre || 'Logo'}
                                className="h-9 w-auto max-w-[140px] object-contain"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-purple-500/20">
                                <Wrench className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-sm sm:text-base tracking-tight block">
                                {activeEmpresa?.nombre || 'Portal de Taller & Reparaciones'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                                Seguimiento de Servicios Técnicos en Vivo
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeEmpresa?.whatsapp_phone && (
                            <a
                                href={`https://wa.me/${activeEmpresa.whatsapp_phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Atención WhatsApp</span>
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* SECCIÓN HERO CON BUSCADOR */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent pt-10 pb-8 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Consulta Online 24/7 sin Iniciar Sesión</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        ¿Cómo va la reparación de tu equipo?
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Ingresa el número de orden impreso en tu ticket (ej. <strong className="text-purple-600 dark:text-purple-400 font-mono">REP-000001</strong>) para conocer el estado y presupuesto en tiempo real.
                    </p>

                    {/* FORMULARIO DE BÚSQUEDA */}
                    <form onSubmit={handleSearch} className="pt-2 max-w-lg mx-auto">
                        <div className="relative flex items-center shadow-lg shadow-purple-500/5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/60 p-1.5 focus-within:border-purple-600 transition-all">
                            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                            <Input
                                type="text"
                                placeholder="Escribe tu N° de orden (Ej: REP-000001)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 shadow-none focus-visible:ring-0 text-base font-mono uppercase bg-transparent placeholder:normal-case placeholder:font-sans"
                            />
                            <Button
                                type="submit"
                                disabled={isSubmittingSearch || !searchQuery.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-5 h-11 shrink-0 gap-1.5 shadow-md shadow-purple-600/20"
                            >
                                {isSubmittingSearch ? 'Buscando...' : 'Consultar'}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>

                    {/* MENSAJE DE NO ENCONTRADO */}
                    {notFound && (
                        <div className="pt-4 max-w-md mx-auto">
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 text-left">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="block font-bold">Orden no localizada</strong>
                                    <span>No encontramos ninguna reparación con el código <strong className="font-mono">{searchedCode}</strong>. Por favor verifica los dígitos de tu ticket e intenta de nuevo.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL: DETALLES DE LA ORDEN LOCALIZADA */}
            {orden ? (
                <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 flex-1">
                    {/* CABECERA DE LA ORDEN LOCALIZADA */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs uppercase font-bold text-slate-400">Orden de Reparación</span>
                                <Badge className="bg-purple-600 hover:bg-purple-600 text-white font-mono text-sm px-2.5 py-0.5">
                                    {orden.numero_orden}
                                </Badge>
                                {isCancelled ? (
                                    <Badge variant="destructive" className="font-bold">Cancelada</Badge>
                                ) : (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold capitalize">
                                        {orden.estado_orden.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                {getDeviceIcon(orden.tipo_dispositivo)}
                                <span>{orden.marca_nombre} {orden.modelo_nombre}</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Titular: <strong className="text-slate-700 dark:text-slate-300">{orden.cliente_nombre_enmascarado}</strong> • Ingresado el {formatDate(orden.fecha_recepcion)}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                            {whatsappContactUrl && (
                                <a
                                    href={whatsappContactUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Consultar al Taller</span>
                                </a>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="gap-1.5 text-xs font-semibold rounded-xl"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir</span>
                            </Button>
                        </div>
                    </div>

                    {/* BANNER DESTACADO: APROBACIÓN DE PRESUPUESTO (SI ESTÁ PENDIENTE) */}
                    {isBudgetPending && (
                        <Card className="border-2 border-amber-400 dark:border-amber-600/70 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-lg shadow-amber-500/5 overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-base">
                                        <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                                        <span>Presupuesto Listo para tu Aprobación</span>
                                    </div>
                                    <Badge className="bg-amber-600 text-white font-mono text-sm px-3 py-1">
                                        Total: {currencySymbol}{orden.costo_estimado.toFixed(2)}
                                    </Badge>
                                </div>
                                <CardDescription className="text-slate-700 dark:text-slate-300 text-xs">
                                    El equipo técnico ha completado la revisión inicial de tu dispositivo. Por favor revisa y confirma si autorizas el trabajo para iniciar de inmediato.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {orden.servicios.length > 0 && (
                                    <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-amber-200 dark:border-amber-800/50 space-y-2">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                            Detalle del Servicio Cotizado:
                                        </div>
                                        <div className="space-y-1.5">
                                            {orden.servicios.map((srv, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-700 dark:text-slate-300">• {srv.descripcion}</span>
                                                    <span className="font-mono font-bold">{currencySymbol}{srv.precio.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                                    <Button
                                        onClick={() => setBudgetActionModal('aprobar')}
                                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl h-11 px-6 shadow-md shadow-emerald-600/20"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span>Aprobar Presupuesto ({currencySymbol}{orden.costo_estimado.toFixed(2)})</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => setBudgetActionModal('rechazar')}
                                        className="w-full sm:w-auto text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold gap-2 rounded-xl h-11 px-5"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Rechazar Presupuesto</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* LÍNEA DE TIEMPO / STEPPER INTERACTIVO */}
                    {!isCancelled && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    <span>Progreso de la Reparación</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {MILESTONES.map((m, idx) => {
                                        const milestoneRank = ORDER_STATE_RANK[m.key] || (idx + 1);
                                        const isCompleted = currentRank > milestoneRank;
                                        const isCurrent = currentRank === milestoneRank;

                                        return (
                                            <div
                                                key={m.key}
                                                className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                                                    isCurrent
                                                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-sm ring-2 ring-purple-500/20'
                                                        : isCompleted
                                                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">PASO 0{idx + 1}</span>
                                                    {isCompleted ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                        </div>
                                                    ) : isCurrent ? (
                                                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center animate-pulse">
                                                            <Clock className="w-3 h-3" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">
                                                    {m.label}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                                    {m.desc}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* BENTO GRID: DETALLES DE DISPOSITIVO, COSTOS, HISTORIAL Y TALLER */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* COLUMNA 1: DISPOSITIVO & FALLA */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-purple-600" />
                                    <span>Información del Dispositivo</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl text-xs border border-slate-100 dark:border-slate-800/60">
                                    <div>
                                        <span className="text-slate-400 block font-medium">Marca</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{orden.marca_nombre}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-medium">Modelo</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{orden.modelo_nombre}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-medium">Color</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{orden.color || 'No especificado'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-medium">IMEI / Serie</span>
                                        <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">{orden.imei_enmascarado || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-medium">Garantía</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{orden.garantia_dias} Días</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-medium">Entrega Estimada</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatDate(orden.fecha_prometida)}</strong>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Falla Reportada en Recepción</span>
                                    </h4>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30">
                                        {orden.descripcion_falla || 'Sin detalle de falla'}
                                    </p>
                                </div>

                                {orden.observaciones_fisicas && (
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Observaciones de Ingreso</span>
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                            {orden.observaciones_fisicas}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* COLUMNA 2: RESUMEN FINANCIERO */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    <span>Resumen de Cuenta</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Presupuesto Acordado</span>
                                        <span className="font-mono font-bold text-sm">
                                            {currencySymbol}{orden.costo_estimado.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Anticipo Abonado</span>
                                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                            -{currencySymbol}{orden.anticipo.toFixed(2)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-black text-xs uppercase tracking-wide">Saldo a Pagar al Retirar</span>
                                        <span className="font-mono font-black text-lg text-purple-700 dark:text-purple-400">
                                            {currencySymbol}{orden.saldo_restante.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3 border border-purple-200 dark:border-purple-900/40 text-xs space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                                        <span>Garantía de Servicio</span>
                                    </div>
                                    <p className="text-[11px] text-purple-900/80 dark:text-purple-300/80">
                                        Este servicio cuenta con <strong>{orden.garantia_dias} días</strong> de respaldo directo sobre repuestos e instalación técnica.
                                    </p>
                                </div>
                            </CardContent>

                            {/* UBICACIÓN DE LA SUCURSAL */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-xl space-y-2">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Taller & Retiro</div>
                                <div className="text-xs space-y-1">
                                    {orden.empresa.direccion && (
                                        <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span>{orden.empresa.direccion}</span>
                                        </div>
                                    )}
                                    {orden.empresa.telefono && (
                                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{orden.empresa.telefono}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* HISTORIAL CRONOLÓGICO DE HITOS */}
                    {orden.historial.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-600" />
                                    <span>Línea de Tiempo del Servicio</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Registro de avances y actualizaciones realizadas por el equipo técnico.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-6">
                                    {orden.historial.map((h, i) => (
                                        <div key={h.id || i} className="relative group">
                                            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-white dark:ring-slate-900" />
                                            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                                                        {h.estado_nuevo ? h.estado_nuevo.replace('_', ' ') : 'Actualización de Servicio'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {formatDate(h.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    {h.comentario || 'Avance registrado en taller.'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </main>
            ) : (
                /* ESTADO VACÍO CUANDO NO HAY BÚSQUEDA */
                <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-8 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                                1
                            </div>
                            <h3 className="font-bold text-sm">Transparencia Total</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Conoce en qué fase exacta se encuentra tu equipo y qué técnico está a cargo de tu dispositivo.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                                2
                            </div>
                            <h3 className="font-bold text-sm">Aprobación en 1 Clic</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Revisa los costos y autoriza el presupuesto directamente desde tu teléfono sin necesidad de llamar.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                                3
                            </div>
                            <h3 className="font-bold text-sm">Garantía Certificada</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Tu orden conserva el registro de repuestos instalados y el plazo de garantía legal por escrito.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN DE APROBACIÓN / RECHAZO DE PRESUPUESTO */}
            <Dialog open={budgetActionModal !== null} onOpenChange={(open) => !open && setBudgetActionModal(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {budgetActionModal === 'aprobar' ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    <span>¿Deseas aprobar este presupuesto?</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                    <span>¿Rechazar presupuesto de reparación?</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {budgetActionModal === 'aprobar' ? (
                                <span>Al aprobar, autorizas al taller a iniciar el reemplazo de piezas y el servicio por un total de <strong>{currencySymbol}{orden?.costo_estimado.toFixed(2)}</strong>.</span>
                            ) : (
                                <span>Al rechazar, el equipo técnico no continuará con el trabajo y tu dispositivo quedará listo para retiro en sucursal.</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {budgetActionModal === 'rechazar' && (
                        <div className="space-y-2 py-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Motivo del rechazo (Opcional):
                            </label>
                            <Textarea
                                placeholder="Ej: Costo elevado, conseguí otro equipo, etc..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="text-xs"
                                rows={3}
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSubmittingDecision}
                            onClick={() => setBudgetActionModal(null)}
                        >
                            Volver
                        </Button>
                        <Button
                            size="sm"
                            disabled={isSubmittingDecision}
                            onClick={() => budgetActionModal && handleBudgetDecision(budgetActionModal)}
                            className={
                                budgetActionModal === 'aprobar'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                            }
                        >
                            {isSubmittingDecision
                                ? 'Procesando...'
                                : budgetActionModal === 'aprobar'
                                ? 'Sí, Aprobar Presupuesto'
                                : 'Confirmar Rechazo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PIE DE PÁGINA */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
                <div className="max-w-4xl mx-auto space-y-1">
                    <div>
                        © {new Date().getFullYear()} {activeEmpresa?.nombre || 'Servicio Técnico'}. Todos los derechos reservados.
                    </div>
                    <div className="text-[11px] text-slate-400">
                        Plataforma de Trazabilidad y Gestión de Taller
                    </div>
                </div>
            </footer>
        </div>
    );
}

ReparacionTracking.layout = (page: React.ReactNode) => page;

