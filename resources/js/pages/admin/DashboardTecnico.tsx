import { Head, Link, router } from '@inertiajs/react';
import {
    Wrench,
    Search,
    Eye,
    Smartphone,
    User,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Package,
    ArrowRight,
    Plus,
    UserCheck,
    Send,
    Sparkles,
    ShieldCheck,
    FileText,
    KeyRound,
    AlertTriangle,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess } from '@/utils/notifications';

interface Orden {
    id: number;
    numero_orden: string;
    cliente_nombre: string;
    cliente_telefono?: string;
    marca_nombre: string;
    modelo_nombre: string;
    imei_serie?: string;
    descripcion_falla: string;
    observaciones_fisicas?: string;
    contrasena_patron?: string;
    inspeccion_json?: any;
    estado_orden: string;
    costo_estimado: number;
    saldo_restante: number;
    fecha_recepcion: string;
    fecha_prometida?: string;
}

interface Props {
    tecnico: {
        id: number;
        name: string;
        email: string;
    };
    counts: {
        en_diagnostico: number;
        en_reparacion: number;
        esperando_repuesto: number;
        reparado_mes: number;
        total_asignados: number;
    };
    misEquiposPendientes: Orden[];
    sinAsignar: Orden[];
    currencySymbol: string;
}

const ELEMENTOS_INSPECCION = [
    'Pantalla',
    'Cristal trasero',
    'Marco',
    'Botones',
    'Bandeja SIM',
    'Cámara trasera',
    'Cámara frontal',
    'Tornillos',
    'Tapa trasera',
    'Puerto de carga',
    'Humedad visible',
    'Equipo doblado',
];

const REVISIONES_ESTADO = [
    { key: 'enciende', label: 'Enciende' },
    { key: 'carga_bateria', label: 'Carga batería' },
    { key: 'entra_sistema', label: 'Entra al sistema' },
    { key: 'tiene_bloqueo', label: 'Tiene bloqueo' },
    { key: 'cliente_proporciona_contrasena', label: 'Cliente proporciona clave/patrón' },
];

const DOT_COORDS: Record<number, { x: number; y: number }> = {
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

function PatternLockCanvas({
    pattern = [],
    onChange,
}: {
    pattern: number[];
    onChange: (p: number[]) => void;
}) {
    const { __ } = useTranslate();
    const [isMouseDown, setIsMouseDown] = useState(false);

    const addDot = (dotNum: number) => {
        if (!pattern.includes(dotNum)) {
            onChange([...pattern, dotNum]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 select-none">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>{__('Patrón dibujado:')}</span>
                {pattern.length > 0 ? (
                    <span className="font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-black border border-indigo-200 dark:border-indigo-800">
                        {pattern.join(' ➔ ')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-normal italic">{__('Toque o arrastre los puntos')}</span>
                )}
            </div>

            <div
                className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl touch-none cursor-crosshair"
                onMouseDown={() => setIsMouseDown(true)}
                onMouseUp={() => setIsMouseDown(false)}
                onMouseLeave={() => setIsMouseDown(false)}
            >
                <svg className="w-[240px] h-[240px]" viewBox="0 0 300 300">
                    {/* Connected glowing lines */}
                    {pattern.map((dot, idx) => {
                        if (idx === 0) return null;
                        const prevDot = pattern[idx - 1];
                        const from = DOT_COORDS[prevDot];
                        const to = DOT_COORDS[dot];
                        return (
                            <g key={`line-${idx}`}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#6366f1"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    opacity="0.8"
                                />
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="#818cf8"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </g>
                        );
                    })}

                    {/* 9 Dots */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dotNum) => {
                        const coord = DOT_COORDS[dotNum];
                        const isSelected = pattern.includes(dotNum);
                        const orderIndex = pattern.indexOf(dotNum);

                        return (
                            <g
                                key={dotNum}
                                onMouseDown={() => addDot(dotNum)}
                                onMouseEnter={() => {
                                    if (isMouseDown) addDot(dotNum);
                                }}
                                onTouchStart={() => addDot(dotNum)}
                                className="cursor-pointer"
                            >
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={isSelected ? 28 : 20}
                                    fill={isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)'}
                                    stroke={isSelected ? 'rgba(99, 102, 241, 0.5)' : 'transparent'}
                                    strokeWidth="2"
                                    className="transition-all duration-200"
                                />
                                <circle
                                    cx={coord.x}
                                    cy={coord.y}
                                    r={14}
                                    fill={isSelected ? '#6366f1' : '#475569'}
                                    stroke={isSelected ? '#c7d2fe' : '#334155'}
                                    strokeWidth="3"
                                    className="transition-all duration-200"
                                />
                                {isSelected ? (
                                    <text
                                        x={coord.x}
                                        y={coord.y + 4}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="12"
                                        fontWeight="900"
                                        fontFamily="monospace"
                                    >
                                        {orderIndex + 1}
                                    </text>
                                ) : (
                                    <circle cx={coord.x} cy={coord.y} r={4} fill="#cbd5e1" />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                disabled={pattern.length === 0}
                className="h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 gap-1.5 rounded-xl"
            >
                <X className="w-3.5 h-3.5" />
                {__('Limpiar Patrón')}
            </Button>
        </div>
    );
}

export default function DashboardTecnico({ tecnico, counts, misEquiposPendientes = [], sinAsignar = [], currencySymbol }: Props) {
    const { __ } = useTranslate();
    const [quickSearch, setQuickSearch] = useState('');

    const [isPreservicioOpen, setIsPreservicioOpen] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
    const [activeTab, setActiveTab] = useState<'fisica' | 'estado' | 'observaciones'>('fisica');

    const [inspeccionFisica, setInspeccionFisica] = useState<Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }>>(() => {
        const init: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
        ELEMENTOS_INSPECCION.forEach((item) => {
            init[item] = { estado: 'na', obs: '' };
        });
        return init;
    });

    const [estadoEquipo, setEstadoEquipo] = useState<Record<string, boolean>>({
        enciende: false,
        carga_bateria: false,
        entra_sistema: false,
        tiene_bloqueo: false,
        cliente_proporciona_contrasena: false,
    });

    // Tipo de bloqueo y patrón interactivo
    const [tipoBloqueo, setTipoBloqueo] = useState<'sin_bloqueo' | 'pin' | 'contrasena' | 'patron'>('sin_bloqueo');
    const [codigoPin, setCodigoPin] = useState('');
    const [claveTexto, setClaveTexto] = useState('');
    const [patternDots, setPatternDots] = useState<number[]>([]);

    const [observacionesFisicas, setObservacionesFisicas] = useState('');
    const [contrasenaPatron, setContrasenaPatron] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuickSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickSearch.trim()) return;
        router.get('/admin/reparaciones', { search: quickSearch.trim() });
    };

    const openPreservicioModal = (orden: Orden) => {
        setSelectedOrden(orden);
        setObservacionesFisicas(orden.observaciones_fisicas || '');
        setContrasenaPatron(orden.contrasena_patron || '');

        // Detect lock type from existing contrasena_patron or json
        if (orden.inspeccion_json?.tipo_bloqueo) {
            setTipoBloqueo(orden.inspeccion_json.tipo_bloqueo);
            if (orden.inspeccion_json.patron_dots) {
                setPatternDots(orden.inspeccion_json.patron_dots);
            }
        } else if (orden.contrasena_patron) {
            if (orden.contrasena_patron.startsWith('Patrón:')) {
                setTipoBloqueo('patron');
            } else if (orden.contrasena_patron.startsWith('PIN:')) {
                setTipoBloqueo('pin');
                setCodigoPin(orden.contrasena_patron.replace('PIN:', '').trim());
            } else if (orden.contrasena_patron.startsWith('Clave:')) {
                setTipoBloqueo('contrasena');
                setClaveTexto(orden.contrasena_patron.replace('Clave:', '').trim());
            }
        } else {
            setTipoBloqueo('sin_bloqueo');
            setPatternDots([]);
            setCodigoPin('');
            setClaveTexto('');
        }

        if (orden.inspeccion_json?.fisica) {
            setInspeccionFisica(orden.inspeccion_json.fisica);
        } else {
            const init: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
            ELEMENTOS_INSPECCION.forEach((item) => {
                init[item] = { estado: 'na', obs: '' };
            });
            setInspeccionFisica(init);
        }

        if (orden.inspeccion_json?.estado) {
            setEstadoEquipo(orden.inspeccion_json.estado);
        } else {
            setEstadoEquipo({
                enciende: false,
                carga_bateria: false,
                entra_sistema: false,
                tiene_bloqueo: false,
                cliente_proporciona_contrasena: false,
            });
        }

        setActiveTab('fisica');
        setIsPreservicioOpen(true);
    };

    const handleSavePreservicio = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrden) return;

        setIsSubmitting(true);

        let finalPasswordString = contrasenaPatron;
        if (tipoBloqueo === 'sin_bloqueo') {
            finalPasswordString = __('Sin Bloqueo');
        } else if (tipoBloqueo === 'pin') {
            finalPasswordString = `PIN: ${codigoPin}`;
        } else if (tipoBloqueo === 'contrasena') {
            finalPasswordString = `Clave: ${claveTexto}`;
        } else if (tipoBloqueo === 'patron') {
            finalPasswordString = `Patrón: ${patternDots.join(' ➔ ')}`;
        }

        const inspeccionPayload = {
            fisica: inspeccionFisica,
            estado: estadoEquipo,
            tipo_bloqueo: tipoBloqueo,
            codigo_pin: codigoPin,
            clave_texto: claveTexto,
            patron_dots: patternDots,
            patron_secuencia: patternDots.join('-'),
        };

        router.post(`/admin/reparaciones/${selectedOrden.id}/estado`, {
            tecnico_id: tecnico.id,
            estado_orden: 'en_diagnostico_presupuesto',
            observaciones_fisicas: observacionesFisicas,
            contrasena_patron: finalPasswordString,
            inspeccion_json: inspeccionPayload,
            comentario: __('Proceso de preservicio e inspección inicial guardado por el técnico.'),
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsPreservicioOpen(false);
                setIsSubmitting(false);
                notifySuccess(__('Proceso de preservicio e inspección guardado correctamente. Orden asignada y en diagnóstico.'));
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'recibido':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 font-bold text-xs">🟡 1-RECIBIDO</Badge>;
            case 'en_diagnostico_presupuesto':
            case 'en_diagnostico':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 font-bold text-xs">🔍 2-EN DIAGNOSTICO Y PRESUPUESTO</Badge>;
            case 'confirmacion_presupuesto':
            case 'presupuestado':
                return <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 font-bold text-xs">⏳ 3-CONFIRMACION DE PRESUPUESTO</Badge>;
            case 'espera_refaccion':
            case 'esperando_repuesto':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 font-bold text-xs">📦 4-ESPERA DE REFACCION</Badge>;
            case 'en_reparacion':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 font-bold text-xs">🛠️ 5-EN REPARACION</Badge>;
            case 'listo_reparado':
            case 'reparado':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-bold text-xs">🟢 6-LISTO PARA ENTREGAR REPARADO</Badge>;
            case 'listo_sin_solucion':
            case 'cancelado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 font-bold text-xs">❌ 7-LISTO PARA ENTREGAR SIN SOLUCION</Badge>;
            case 'entregado_finalizado':
            case 'entregado':
                return <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs">✅ 8-ENTREGADO FINALIZADO</Badge>;
            case 'reincidencia_garantia':
            case 'reincidencia':
                return <Badge className="bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-300 font-bold text-xs">🔄 8-REINCIDENCIA/GARANTIA</Badge>;
            default:
                return <Badge variant="outline">{st?.replace(/_/g, ' ').toUpperCase()}</Badge>;
        }
    };

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr || '';
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard Técnico'), href: '/admin/dashboard' },
    ];

    return (
        <>
            <Head title={__('Dashboard Técnico de Taller')} />

            <div className="w-full space-y-6 pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* BANNER HERMANO DE BIENVENIDA AL TÉCNICO */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                🛠️ {__('Panel de Taller & Servicio Técnico')}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                                {__('¡Hola,')} {tecnico.name}! 👋
                            </h1>
                            <p className="text-xs text-purple-200/90 max-w-xl">
                                {__('Tienes')} <strong className="text-white font-bold">{counts.total_asignados} {__('equipos en trabajo activo')}</strong>. {__('Supervisa diagnósticos, solicita repuestos y registra avances.')}
                            </p>
                        </div>

                        {/* BÚSQUEDA RÁPIDA DE FOLIO / IMEI */}
                        <form onSubmit={handleQuickSearch} className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-md w-full md:w-80 shrink-0">
                            <Search className="w-4 h-4 text-purple-300 ml-2 shrink-0" />
                            <Input
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                placeholder={__('Buscar Folio o IMEI...')}
                                className="bg-transparent border-0 text-xs text-white placeholder:text-purple-300/70 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                            />
                            <Button type="submit" size="sm" className="h-8 px-3 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-lg shrink-0">
                                {__('Ir')}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* 5 CARDS KPIS DE PRODUCTIVIDAD Y CARGA DE TRABAJO */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 shrink-0">
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('En Reparación')}</span>
                                <h3 className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">{counts.en_reparacion}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('En Diagnóstico')}</span>
                                <h3 className="text-2xl font-black font-mono text-blue-700 dark:text-blue-300">{counts.en_diagnostico}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Esperando Pieza')}</span>
                                <h3 className="text-2xl font-black font-mono text-orange-700 dark:text-orange-300">{counts.esperando_repuesto}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Listos este Mes')}</span>
                                <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{counts.reparado_mes}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{__('Total Asignados')}</span>
                                <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{counts.total_asignados}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* MIS EQUIPOS ASIGNADOS */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            {__('Mis Equipos Asignados Activos')} ({misEquiposPendientes.length})
                        </CardTitle>

                        <Link href="/admin/reparaciones">
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-purple-600 hover:text-purple-700">
                                {__('Ver Todas las Órdenes')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                    <th className="px-4 py-3">{__('Cliente')}</th>
                                    <th className="px-4 py-3">{__('Equipo / Modelo')}</th>
                                    <th className="px-4 py-3">{__('Falla Reportada')}</th>
                                    <th className="px-4 py-3 text-center">{__('Estado')}</th>
                                    <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {misEquiposPendientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                            {__('No tienes órdenes pendientes asignadas actualmente.')}
                                        </td>
                                    </tr>
                                ) : (
                                    misEquiposPendientes.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-bold text-purple-700 dark:text-purple-400 block">{o.numero_orden}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">📅 {formatDate(o.fecha_recepcion)}</span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {o.cliente_nombre}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                                {o.marca_nombre} {o.modelo_nombre}
                                                {o.imei_serie && <span className="text-[10px] font-mono text-slate-400 block font-normal">IMEI: {o.imei_serie}</span>}
                                            </td>
                                            <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300 truncate" title={o.descripcion_falla}>
                                                {o.descripcion_falla}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(o.estado_orden)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link href={`/admin/reparaciones/${o.id}`}>
                                                    <Button size="sm" className="h-7 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {__('Trabajar')}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* EQUIPOS SIN ASIGNAR EN TALLER */}
                {sinAsignar.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-900 shadow-xs bg-amber-50/30 dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="p-4 border-b border-amber-200 dark:border-amber-900/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                {__('Equipos Recién Ingresados Sin Técnico Asignado')} ({sinAsignar.length})
                            </CardTitle>
                        </CardHeader>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-amber-100/50 dark:bg-slate-950 text-amber-900 dark:text-amber-200 uppercase text-[10px] font-bold border-b border-amber-200 dark:border-amber-900/50">
                                    <tr>
                                        <th className="px-4 py-3">{__('Folio / Fecha')}</th>
                                        <th className="px-4 py-3">{__('Cliente')}</th>
                                        <th className="px-4 py-3">{__('Equipo')}</th>
                                        <th className="px-4 py-3">{__('Falla')}</th>
                                        <th className="px-4 py-3 text-center">{__('Acción')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 dark:divide-slate-800">
                                    {sinAsignar.map((o) => (
                                        <tr key={o.id} className="hover:bg-amber-100/30 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-mono font-bold text-amber-900 dark:text-amber-200">{o.numero_orden}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{o.cliente_nombre}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{o.marca_nombre} {o.modelo_nombre}</td>
                                            <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300 truncate">{o.descripcion_falla}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Button size="sm" onClick={() => openPreservicioModal(o)} className="h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    {__('Iniciar proceso de preservicio')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* MODAL VENTANA DE PRESERVICIO E INSPECCIÓN FÍSICA AMPLIADA CON PESTAÑAS (TABS) */}
            <Dialog open={isPreservicioOpen} onOpenChange={setIsPreservicioOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] md:max-w-[92vw] lg:max-w-[88vw] xl:max-w-[85vw] h-[92vh] max-h-[92vh] flex flex-col p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header Banner Ampliado */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                    {__('Ficha de Preservicio e Inspección Técnica')}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight text-white">
                                    {selectedOrden?.marca_nombre} {selectedOrden?.modelo_nombre}
                                </h2>
                                <p className="text-xs text-slate-300 flex items-center gap-2">
                                    <span>{__('Falla reportada:')}</span>
                                    <span className="text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                        {selectedOrden?.descripcion_falla}
                                    </span>
                                </p>
                            </div>

                            {selectedOrden && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-indigo-200">
                                        📋 {selectedOrden.numero_orden}
                                    </span>
                                    <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
                                        👤 {selectedOrden.cliente_nombre}
                                    </span>
                                    {selectedOrden.imei_serie && (
                                        <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-slate-300">
                                            📱 {selectedOrden.imei_serie}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PESTAÑAS / TABS DE NAVEGACIÓN */}
                        <div className="flex items-center gap-2 mt-6 border-b border-white/10 pt-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('fisica')}
                                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
                                    activeTab === 'fisica'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-white/20 font-black shadow-md'
                                        : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Search className="w-3.5 h-3.5" />
                                {__('1. Inspección Física')}
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                                    {Object.values(inspeccionFisica).filter((i) => i.estado === 'malo').length > 0 ? (
                                        <span className="text-rose-300 font-extrabold">
                                            {Object.values(inspeccionFisica).filter((i) => i.estado === 'malo').length} {__('Dañados')}
                                        </span>
                                    ) : (
                                        `${Object.values(inspeccionFisica).filter((i) => i.estado !== 'na').length}/12`
                                    )}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('estado')}
                                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
                                    activeTab === 'estado'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-white/20 font-black shadow-md'
                                        : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {__('2. Estado Funcional')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('observaciones')}
                                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
                                    activeTab === 'observaciones'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-white/20 font-black shadow-md'
                                        : 'bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                {__('3. Observaciones & Clave')}
                                {(observacionesFisicas || contrasenaPatron) && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                )}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSavePreservicio} className="flex flex-col flex-1 overflow-hidden">
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* PESTAÑA 1: INSPECCIÓN FÍSICA */}
                            {activeTab === 'fisica' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="space-y-0.5">
                                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">1</span>
                                                {__('Inspección Estética & Componentes Físicos (12 Puntos)')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {__('Seleccione la condición estética de cada elemento al momento de la recepción del dispositivo.')}
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const allBueno: Record<string, { estado: 'bueno' | 'malo' | 'na'; obs: string }> = {};
                                                ELEMENTOS_INSPECCION.forEach((item) => {
                                                    allBueno[item] = { estado: 'bueno', obs: inspeccionFisica[item]?.obs || '' };
                                                });
                                                setInspeccionFisica(allBueno);
                                            }}
                                            className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 gap-1.5 shadow-xs shrink-0"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            {__('Marcar Todos como Bueno')}
                                        </Button>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3">{__('Elemento a Inspeccionar')}</th>
                                                    <th className="px-4 py-3 text-center w-64">{__('Condición')}</th>
                                                    <th className="px-4 py-3">{__('Observación / Detalles del Daño')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {ELEMENTOS_INSPECCION.map((item) => {
                                                    const current = inspeccionFisica[item] || { estado: 'na', obs: '' };
                                                    const isMalo = current.estado === 'malo';
                                                    const isBueno = current.estado === 'bueno';

                                                    return (
                                                        <tr
                                                            key={item}
                                                            className={`transition-colors ${
                                                                isMalo
                                                                    ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                                                    : isBueno
                                                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                                                                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                                                <div className="flex items-center gap-2">
                                                                    {isMalo && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                                                                    {isBueno && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                                    <span className="text-sm">{item}</span>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisica((prev) => ({ ...prev, [item]: { ...prev[item], estado: 'bueno' } }))}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                            current.estado === 'bueno'
                                                                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                        }`}
                                                                    >
                                                                        {__('Bueno')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisica((prev) => ({ ...prev, [item]: { ...prev[item], estado: 'malo' } }))}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                            current.estado === 'malo'
                                                                                ? 'bg-rose-600 text-white shadow-xs scale-105'
                                                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                                        }`}
                                                                    >
                                                                        {__('Malo')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInspeccionFisica((prev) => ({ ...prev, [item]: { ...prev[item], estado: 'na' } }))}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                            current.estado === 'na'
                                                                                ? 'bg-slate-700 text-white dark:bg-slate-600 shadow-xs'
                                                                                : 'text-slate-500 hover:text-slate-800'
                                                                        }`}
                                                                    >
                                                                        {__('N/A')}
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <Input
                                                                    value={current.obs}
                                                                    onChange={(e) => setInspeccionFisica((prev) => ({ ...prev, [item]: { ...prev[item], obs: e.target.value } }))}
                                                                    placeholder={isMalo ? __('Describa el daño o raspones especificos...') : __('Detalle opcional...')}
                                                                    className={`h-9 text-xs font-medium rounded-lg ${
                                                                        isMalo
                                                                            ? 'border-rose-300 focus:border-rose-500 bg-white dark:bg-slate-900 shadow-xs'
                                                                            : 'border-slate-200 dark:border-slate-800'
                                                                    }`}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 2: ESTADO FUNCIONAL */}
                            {activeTab === 'estado' && (
                                <div className="space-y-5">
                                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">2</span>
                                            {__('Estado Funcional Inicial del Equipo')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {__('Verifique las funciones electrónicas básicas al recibir el equipo.')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {REVISIONES_ESTADO.map((rev) => {
                                            const isChecked = estadoEquipo[rev.key] ?? false;
                                            return (
                                                <div
                                                    key={rev.key}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                        isChecked
                                                            ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900'
                                                    }`}
                                                >
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rev.label}</span>
                                                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: true }))}
                                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                                                isChecked
                                                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {__('Sí')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEstadoEquipo((prev) => ({ ...prev, [rev.key]: false }))}
                                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                                                !isChecked
                                                                    ? 'bg-rose-600 text-white shadow-xs scale-105'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {__('No')}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 3: OBSERVACIONES & CONTRASEÑA */}
                            {activeTab === 'observaciones' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Observaciones Físicas con Etiquetas Rápidas */}
                                    <div className="space-y-3">
                                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                                {__('6. Observaciones Físicas Adicionales')}
                                            </h3>
                                        </div>

                                        <Textarea
                                            value={observacionesFisicas}
                                            onChange={(e) => setObservacionesFisicas(e.target.value)}
                                            rows={5}
                                            placeholder={__('Anotar rayones, raspones, golpes, humedad y demás detalles físicos...')}
                                            className="text-xs border-slate-200 dark:border-slate-800 rounded-xl p-3"
                                        />

                                        {/* Etiquetas de inserción rápida */}
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{__('Inserción rápida de detalles:')}</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    'Rayones en pantalla',
                                                    'Golpes en esquinas',
                                                    'Tapa trasera fisurada',
                                                    'Tapa despegada',
                                                    'Sin bandeja SIM',
                                                    'Con humedad / sulfato',
                                                    'Lente de cámara rayado',
                                                ].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => {
                                                            setObservacionesFisicas((prev) => {
                                                                const clean = prev.trim();
                                                                return clean ? `${clean}. ${tag}` : tag;
                                                            });
                                                        }}
                                                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 transition-colors"
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contraseña / PIN / Patrón */}
                                    <div className="space-y-4">
                                        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <KeyRound className="w-4 h-4 text-indigo-500" />
                                                {__('7. Tipo de Bloqueo & Claves de Acceso')}
                                            </h3>
                                        </div>

                                        {/* Selector de Tipo de Bloqueo */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { id: 'sin_bloqueo', label: __('Sin Bloqueo'), icon: '🔓' },
                                                { id: 'pin', label: __('Código PIN'), icon: '🔢' },
                                                { id: 'contrasena', label: __('Contraseña'), icon: '🔠' },
                                                { id: 'patron', label: __('Patrón (3x3)'), icon: '🌀' },
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setTipoBloqueo(t.id as any)}
                                                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                                        tipoBloqueo === t.id
                                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs ring-2 ring-indigo-500/20 font-black'
                                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="text-lg">{t.icon}</span>
                                                    <span>{t.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Contenido según tipo de bloqueo */}
                                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 space-y-4">
                                            {tipoBloqueo === 'sin_bloqueo' && (
                                                <div className="text-center py-4 text-xs font-medium text-slate-500">
                                                    ✅ {__('El cliente indica que el equipo no posee ningún bloqueo de pantalla.')}
                                                </div>
                                            )}

                                            {tipoBloqueo === 'pin' && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{__('Ingrese el código PIN numérico:')}</Label>
                                                    <Input
                                                        value={codigoPin}
                                                        onChange={(e) => setCodigoPin(e.target.value)}
                                                        placeholder={__('ej: 1234 o 0000')}
                                                        className="text-center text-lg h-12 font-mono font-bold tracking-widest bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                                    />
                                                </div>
                                            )}

                                            {tipoBloqueo === 'contrasena' && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{__('Ingrese la clave / contraseña alfanumérica:')}</Label>
                                                    <Input
                                                        value={claveTexto}
                                                        onChange={(e) => setClaveTexto(e.target.value)}
                                                        placeholder={__('ej: MiClaveSegura2026')}
                                                        className="text-sm h-12 font-mono font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                                                    />
                                                </div>
                                            )}

                                            {tipoBloqueo === 'patron' && (
                                                <PatternLockCanvas
                                                    pattern={patternDots}
                                                    onChange={(newPattern) => setPatternDots(newPattern)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer con Navegación de Pestañas y Guardado */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPreservicioOpen(false)}
                                    disabled={isSubmitting}
                                    className="text-xs font-bold px-4"
                                >
                                    {__('Cancelar')}
                                </Button>

                                {activeTab !== 'fisica' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            if (activeTab === 'observaciones') setActiveTab('estado');
                                            else if (activeTab === 'estado') setActiveTab('fisica');
                                        }}
                                        className="text-xs font-bold text-slate-600 dark:text-slate-400"
                                    >
                                        ⬅️ {__('Anterior')}
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTab !== 'observaciones' ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (activeTab === 'fisica') setActiveTab('estado');
                                            else if (activeTab === 'estado') setActiveTab('observaciones');
                                        }}
                                        className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 gap-1.5 rounded-xl px-4 h-10"
                                    >
                                        {__('Siguiente')} ➔
                                    </Button>
                                ) : null}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 gap-2 shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    {isSubmitting ? __('Guardando...') : __('Guardar e Iniciar Preservicio')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
