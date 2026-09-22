import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { 
    Clock, 
    Calendar, 
    LogIn, 
    LogOut, 
    Utensils, 
    Coffee, 
    Search, 
    RotateCcw, 
    Eye, 
    Building2, 
    UserCheck, 
    ListOrdered, 
    ShieldCheck, 
    Camera, 
    MapPin, 
    FileText, 
    Timer, 
    AlertTriangle, 
    CheckCircle2, 
    Hourglass,
    Download,
    FileSpreadsheet,
    LayoutDashboard,
    ExternalLink,
    Scale,
    ShieldAlert,
    Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Paginated } from '@/types/app';
import Pagination from '@/components/pagination';
import { useTranslate } from '@/hooks/use-translate';

interface TiempoRestanteInfo {
    estado: 'en_curso' | 'excedido' | 'completado' | 'normal';
    concepto?: string;
    texto: string;
    subtexto?: string | null;
    minutos_restantes?: number | null;
    limite_minutos?: number;
    transcurridos?: number;
    duracion_real?: number;
}

interface MarcajeIndividual {
    id: number;
    empleado_id: number;
    tipo_marcaje: 'entrada' | 'salida_comida' | 'entrada_comida' | 'salida' | 'descanso_inicio' | 'descanso_fin' | 'entrada_extraordinaria';
    fecha_hora: string;
    fecha_hora_iso?: string;
    fecha_hora_local?: string;
    zona_horaria?: string;
    origen: string;
    latitud?: number | string | null;
    longitud?: number | string | null;
    geolocalizacion?: string | null;
    fotografia_path?: string | null;
    observaciones?: string | null;
    sucursal?: { nombre: string; zona_horaria?: string };
}

interface SemanaLftInfo {
    periodo: { inicio: string; fin: string; ano_reforma: number };
    limites: { normales: number; tex_doble: number; tex_triple: number; total: number };
    horas: { normales: number; tex_doble: number; tex_triple: number; extra_brutas: number; totales: number };
    semaforos: {
        normal: { horas: number; limite: number; estado: 'normal' | 'verde' | 'amarillo' | 'rojo'; label: string; notificar_a?: string | null };
        tex_doble: { horas: number; limite: number; estado: 'normal' | 'verde' | 'amarillo' | 'rojo'; label: string };
        tex_triple: { horas: number; limite: number; estado: 'normal' | 'verde' | 'amarillo' | 'rojo'; label: string };
        alerta_global: 'normal' | 'verde' | 'amarillo' | 'rojo';
        destinatarios: string[];
    };
}

interface EmpleadoBitacora {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    departamento?: { nombre: string };
    cargo?: { nombre: string };
    responsable?: { nombres: string; apellidos: string };
    sucursal?: { nombre: string; zona_horaria?: string };
    turnoLaboral?: { minutos_descanso?: number; nombre?: string };
    ultimo_marcaje?: MarcajeIndividual | null;
    tiempo_restante_info?: TiempoRestanteInfo | null;
    historial_marcajes: MarcajeIndividual[];
    conteo_eventos: {
        total: number;
        entradas: number;
        descansos: number;
        salidas: number;
    };
    semana_lft?: SemanaLftInfo | null;
}

/** Componente de Contador en Tiempo Real (Reloj en vivo segundo a segundo) */
function LiveBreakTimer({ 
    fechaHoraIso,
    fechaHora, 
    limiteMinutos = 15, 
    subtexto 
}: { 
    fechaHoraIso?: string;
    fechaHora: string; 
    limiteMinutos?: number; 
    subtexto?: string | null;
}) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const dateStr = fechaHoraIso || fechaHora;
    const startMs = new Date(dateStr).getTime();
    const elapsedSeconds = Math.floor(Math.max(0, now - startMs) / 1000);
    const limitSeconds = limiteMinutos * 60;
    const remainingSeconds = limitSeconds - elapsedSeconds;

    const formatTimeDuration = (totalSecs: number) => {
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (remainingSeconds > 0) {
        const formatted = formatTimeDuration(remainingSeconds);
        const suffix = remainingSeconds < 3600 ? ' ' + __('min restantes') : ' ' + __('restantes');
        return (
            <div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 px-2.5 py-1 font-semibold text-xs font-mono">
                    <Timer className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" />
                    <span><span dir="ltr">{formatted}</span>{suffix}</span>
                </Badge>
                {subtexto && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                        {subtexto}
                    </div>
                )}
            </div>
        );
    } else {
        const excessSeconds = Math.abs(remainingSeconds);
        const formatted = formatTimeDuration(excessSeconds);
        const suffix = excessSeconds < 3600 ? ' ' + __('min') : '';
        return (
            <div>
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1.5 px-2.5 py-1 font-semibold text-xs font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                    <span>{__('Excedido por')} <span dir="ltr">{formatted}</span>{suffix}</span>
                </Badge>
                {subtexto && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">
                        {subtexto}
                    </div>
                )}
            </div>
        );
    }
}

interface Stats {
    total: number;
    entradas: number;
    descansos: number;
    salidas: number;
}

interface SucursalOption {
    id: number;
    nombre: string;
    zona_horaria?: string;
}

interface ResponsableOption {
    id: number;
    nombres: string;
    apellidos: string;
}

interface Props {
    marcajes: Paginated<EmpleadoBitacora>;
    stats?: Stats;
    sucursales?: SucursalOption[];
    responsables?: ResponsableOption[];
    filters: {
        search?: string;
        tipo_marcaje?: string;
        origen?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        sucursal_id?: number | string;
        responsable_id?: number | string;
        perPage?: number;
    };
}

export default function AsistenciaBitacoraIndex({ marcajes, stats, sucursales = [], responsables = [], filters }: Props) {
    const { __, currentLocale, isRtl } = useTranslate();
    const [search, setSearch] = useState(filters.search || '');
    const [tipoMarcaje, setTipoMarcaje] = useState(filters.tipo_marcaje || 'todos');
    const [origen, setOrigen] = useState(filters.origen || 'todos');
    const [sucursalId, setSucursalId] = useState(filters.sucursal_id ? String(filters.sucursal_id) : 'todas');
    const [responsableId, setResponsableId] = useState(filters.responsable_id ? String(filters.responsable_id) : 'todos');
    const [fechaInicio, setFechaInicio] = useState(filters.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filters.fecha_fin || '');
    const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoBitacora | null>(null);

    const formatFechaHora = (fechaStr?: string) => {
        if (!fechaStr) return '';
        if (fechaStr.includes('T') || fechaStr.includes('Z')) {
            const dateObj = new Date(fechaStr);
            if (!isNaN(dateObj.getTime())) {
                const datePart = dateObj.toLocaleDateString(currentLocale === 'ar' ? 'ar-u-nu-latn' : 'es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const timePart = dateObj.toLocaleTimeString(currentLocale === 'ar' ? 'ar-u-nu-latn' : 'es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                return `${datePart} ${timePart}`;
            }
        }
        return fechaStr;
    };

    const handleFilter = () => {
        router.get('/admin/asistencia/bitacora', {
            search: search || undefined,
            tipo_marcaje: tipoMarcaje !== 'todos' ? tipoMarcaje : undefined,
            origen: origen !== 'todos' ? origen : undefined,
            sucursal_id: sucursalId !== 'todas' ? sucursalId : undefined,
            responsable_id: responsableId !== 'todos' ? responsableId : undefined,
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setTipoMarcaje('todos');
        setOrigen('todos');
        setSucursalId('todas');
        setResponsableId('todos');
        setFechaInicio('');
        setFechaFin('');
        router.get('/admin/asistencia/bitacora', {}, { preserveState: true });
    };

    const handleExport = (formato: 'excel' | 'csv') => {
        const params = new URLSearchParams();
        params.set('formato', formato);
        if (search) params.set('search', search);
        if (tipoMarcaje && tipoMarcaje !== 'todos') params.set('tipo_marcaje', tipoMarcaje);
        if (origen && origen !== 'todos') params.set('origen', origen);
        if (sucursalId && sucursalId !== 'todas') params.set('sucursal_id', sucursalId);
        if (responsableId && responsableId !== 'todos') params.set('responsable_id', responsableId);
        if (fechaInicio) params.set('fecha_inicio', fechaInicio);
        if (fechaFin) params.set('fecha_fin', fechaFin);

        window.open(`/admin/asistencia/bitacora/exportar?${params.toString()}`, '_blank');
    };

    const setQuickDate = (range: 'today' | 'week' | 'month') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        if (range === 'today') {
            const str = formatDate(today);
            setFechaInicio(str);
            setFechaFin(str);
            router.get('/admin/asistencia/bitacora', { fecha_inicio: str, fecha_fin: str }, { preserveState: true });
        } else if (range === 'week') {
            const dayOfWeek = today.getDay() || 7;
            const monday = new Date(today);
            monday.setDate(today.getDate() - dayOfWeek + 1);
            const startStr = formatDate(monday);
            const endStr = formatDate(today);
            setFechaInicio(startStr);
            setFechaFin(endStr);
            router.get('/admin/asistencia/bitacora', { fecha_inicio: startStr, fecha_fin: endStr }, { preserveState: true });
        } else if (range === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const startStr = formatDate(firstDay);
            const endStr = formatDate(today);
            setFechaInicio(startStr);
            setFechaFin(endStr);
            router.get('/admin/asistencia/bitacora', { fecha_inicio: startStr, fecha_fin: endStr }, { preserveState: true });
        }
    };

    const getBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case 'entrada':
                return { label: __('Entrada'), class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: LogIn };
            case 'salida_comida':
                return { label: __('Salida Comida'), class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Utensils };
            case 'entrada_comida':
                return { label: __('Regreso Comida'), class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Utensils };
            case 'descanso_inicio':
                return { label: __('Descanso Inicio'), class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Coffee };
            case 'descanso_fin':
                return { label: __('Descanso Fin'), class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: Coffee };
            case 'salida':
                return { label: __('Salida'), class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: LogOut };
            case 'entrada_extraordinaria':
                return { label: __('Entrada Extra'), class: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', icon: LogIn };
            default:
                return { label: __(tipo), class: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: Clock };
        }
    };

    const getOrigenBadge = (origenStr: string) => {
        switch (origenStr) {
            case 'kiosko_tactil':
            case 'kiosko':
            case 'reloj_checador':
                return { label: __('Reloj Checador'), class: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200' };
            case 'garita':
                return { label: __('Garita Acceso'), class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' };
            case 'app_movil':
                return { label: __('App Móvil'), class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' };
            case 'reconocimiento_facial':
                return { label: __('Facial AI'), class: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200' };
            case 'manual_admin':
                return { label: __('Manual Admin'), class: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' };
            default:
                return { label: __(origenStr), class: 'bg-gray-50 text-gray-700 border-gray-200' };
        }
    };

    return (
        <>
            <Head title={__('Bitácora de Asistencia')} />

            <div className="space-y-6">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: __('Asistencia'), href: '/admin/asistencia' },
                        { title: __('Bitácora de Marcajes'), href: '/admin/asistencia/bitacora' },
                    ]}
                />

                <ModuleHeader
                    title={__('Bitácora de Asistencia por Empleado')}
                    description={__('Supervisión agrupada de marcajes, descansos de Ley Silla y almuerzos en tiempo real.')}
                    icon={<Clock className="h-6 w-6 text-white" />}
                    colorClassName="bg-indigo-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/asistencia/panel-control">
                            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1.5 text-xs font-semibold shadow-xs">
                                <LayoutDashboard className="w-3.5 h-3.5 rtl:mr-0 rtl:ml-1.5" />
                                {__('Panel por Sede')}
                            </Button>
                        </Link>
                        <Button
                            onClick={() => handleExport('excel')}
                            variant="secondary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1.5 text-xs font-semibold shadow-xs"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 rtl:mr-0 rtl:ml-1.5" />
                            {__('Exportar Excel')}
                        </Button>
                        <Button
                            onClick={() => handleExport('csv')}
                            variant="secondary"
                            size="sm"
                            className="bg-slate-800/90 hover:bg-slate-900 text-white border border-white/20 gap-1.5 text-xs font-semibold shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5 rtl:mr-0 rtl:ml-1.5" />
                            {__('CSV')}
                        </Button>
                    </div>
                </ModuleHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title={__('Total Marcajes Auditados')}
                        value={stats?.total ?? marcajes.total}
                        icon={<Clock className="w-5 h-5 text-indigo-600" />}
                        colorClassName="bg-indigo-100 dark:bg-indigo-900/30"
                    />
                    <StatCard
                        title={__('Entradas Registradas')}
                        value={stats?.entradas ?? 0}
                        icon={<LogIn className="w-5 h-5 text-emerald-600" />}
                        colorClassName="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                    <StatCard
                        title={__('Descansos / Almuerzos')}
                        value={stats?.descansos ?? 0}
                        icon={<Coffee className="w-5 h-5 text-purple-600" />}
                        colorClassName="bg-purple-100 dark:bg-purple-900/30"
                    />
                    <StatCard
                        title={__('Salidas Registradas')}
                        value={stats?.salidas ?? 0}
                        icon={<LogOut className="w-5 h-5 text-rose-600" />}
                        colorClassName="bg-rose-100 dark:bg-rose-900/30"
                    />
                </div>

                <FilterBar>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
                        <FilterField label={__('Buscar Empleado')}>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder={__('Nombre o N°...')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 rtl:pl-3 rtl:pr-9 text-xs"
                                />
                            </div>
                        </FilterField>

                        <FilterField label={__('Sede / Sucursal')}>
                            <Select value={sucursalId} onValueChange={setSucursalId}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder={__('Todas las sedes')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">{__('Todas las sedes')}</SelectItem>
                                    {sucursales.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Responsable')}>
                            <Select value={responsableId} onValueChange={setResponsableId}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">{__('Todos los supervisores')}</SelectItem>
                                    {responsables.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            {r.nombres} {r.apellidos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Tipo de Marcaje')}>
                            <Select value={tipoMarcaje} onValueChange={setTipoMarcaje}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder={__('Todos los eventos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">{__('Todos los eventos')}</SelectItem>
                                    <SelectItem value="entrada">{__('Entradas')}</SelectItem>
                                    <SelectItem value="salida_comida">{__('Salidas a Comida')}</SelectItem>
                                    <SelectItem value="entrada_comida">{__('Regresos de Comida')}</SelectItem>
                                    <SelectItem value="descanso_inicio">{__('Inicio Descanso Ley Silla')}</SelectItem>
                                    <SelectItem value="descanso_fin">{__('Fin Descanso Ley Silla')}</SelectItem>
                                    <SelectItem value="salida">{__('Salidas')}</SelectItem>
                                    <SelectItem value="entrada_extraordinaria">{__('Entrada Extra')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Origen / Dispositivo')}>
                            <Select value={origen} onValueChange={setOrigen}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder={__('Todos los orígenes')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">{__('Todos los orígenes')}</SelectItem>
                                    <SelectItem value="kiosko">{__('Reloj Checador (Kiosko)')}</SelectItem>
                                    <SelectItem value="app">{__('App Móvil')}</SelectItem>
                                    <SelectItem value="garita">{__('Garita de Acceso')}</SelectItem>
                                    <SelectItem value="facial">{__('Reconocimiento Facial')}</SelectItem>
                                    <SelectItem value="manual_admin">{__('Manual Admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Fecha Inicio')}>
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="text-xs"
                            />
                        </FilterField>

                        <FilterField label={__('Fecha Fin')}>
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="text-xs"
                            />
                        </FilterField>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-muted/50 text-xs text-muted-foreground">
                        <span className="font-medium">{__('Accesos rápidos:')}</span>
                        <button onClick={() => setQuickDate('today')} className="hover:underline text-indigo-600 font-medium">{__('Hoy')}</button>
                        <span>•</span>
                        <button onClick={() => setQuickDate('week')} className="hover:underline text-indigo-600 font-medium">{__('Esta Semana')}</button>
                        <span>•</span>
                        <button onClick={() => setQuickDate('month')} className="hover:underline text-indigo-600 font-medium">{__('Este Mes')}</button>
                        <Button size="sm" onClick={handleFilter} className="ml-auto bg-indigo-600 h-7 text-xs">{__('Filtrar')}</Button>
                        <Button size="sm" variant="outline" onClick={handleReset} className="h-7"><RotateCcw className="w-3.5 h-3.5" /></Button>
                    </div>
                </FilterBar>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            <CardTitle className="text-base font-semibold">{__('Bitácora de Asistencia por Empleado')}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                            <span dir="ltr">{marcajes.total || marcajes.data.length}</span> {__('empleados auditados')}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left rtl:text-right">{__('Empleado')}</th>
                                        <th className="px-4 py-3.5 text-left rtl:text-right">{__('Último Evento')}</th>
                                        <th className="px-4 py-3.5 text-left rtl:text-right">{__('Estado / Tiempo Restante')}</th>
                                        <th className="px-4 py-3.5 text-left rtl:text-right">{__('Semáforo LFT (Semana)')}</th>
                                        <th className="px-4 py-3.5 text-center">{__('Eventos en Período')}</th>
                                        <th className="px-4 py-3.5 text-left rtl:text-right">{__('Origen & Sucursal')}</th>
                                        <th className="px-4 py-3.5 text-right rtl:text-left">{__('Acción')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {marcajes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium">{__('No se encontraron empleados con marcajes en el período.')}</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        marcajes.data.map((emp) => {
                                            const ultimo = emp.ultimo_marcaje;
                                            const badge = ultimo ? getBadgeStyle(ultimo.tipo_marcaje) : null;
                                            const origenBadge = ultimo ? getOrigenBadge(ultimo.origen) : null;
                                            const IconComp = badge?.icon;
                                            const infoTiempo = emp.tiempo_restante_info;
                                            const initials = `${emp.nombres.charAt(0)}${emp.apellidos.charAt(0)}`.toUpperCase();

                                            return (
                                                <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-600/20">
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{emp.nombres} {emp.apellidos}</div>
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                                    <span className="font-mono font-medium">{__('N°')} <span dir="ltr">{emp.documento_identidad}</span></span>
                                                                    <span>•</span>
                                                                    <span>{emp.departamento?.nombre || __('General')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {ultimo && badge && IconComp ? (
                                                            <div className="space-y-1">
                                                                <Badge className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-medium border ${badge.class}`}>
                                                                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                                                                    <span>{badge.label}</span>
                                                                </Badge>
                                                                <div className="font-mono text-xs text-slate-600">{formatFechaHora(ultimo.fecha_hora)}</div>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">Sin registros</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {infoTiempo && ultimo ? (
                                                            ultimo.tipo_marcaje === 'salida' ? (
                                                                <div>
                                                                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 font-medium text-xs">
                                                                        Jornada Finalizada
                                                                    </Badge>
                                                                    {infoTiempo.subtexto && (
                                                                        <div className="text-[11px] text-slate-500 mt-1">{infoTiempo.subtexto}</div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <LiveBreakTimer fechaHora={ultimo.fecha_hora} fechaHoraIso={ultimo.fecha_hora_iso} limiteMinutos={infoTiempo.limite_minutos ?? 15} subtexto={infoTiempo.subtexto} />
                                                            )
                                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {emp.semana_lft ? (() => {
                                                            const sem = emp.semana_lft;
                                                            const norm = sem.semaforos.normal;
                                                            const dbl = sem.semaforos.tex_doble;
                                                            const trp = sem.semaforos.tex_triple;

                                                            let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
                                                            let dotColor = "bg-slate-400";
                                                            let alertText = `${norm.horas}h / ${norm.limite}h`;

                                                            if (norm.estado === 'rojo') {
                                                                badgeStyle = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold";
                                                                dotColor = "bg-rose-500 animate-pulse";
                                                                alertText = `${norm.horas}h (🔴 DG)`;
                                                            } else if (norm.estado === 'amarillo') {
                                                                badgeStyle = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-bold";
                                                                dotColor = "bg-amber-500 animate-pulse";
                                                                alertText = `${norm.horas}h (🟡 Resp)`;
                                                            } else if (norm.estado === 'verde') {
                                                                badgeStyle = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold";
                                                                dotColor = "bg-emerald-500";
                                                                alertText = `${norm.horas}h (🟢 RH)`;
                                                            }

                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Badge variant="outline" className={`text-xs gap-1.5 py-0.5 px-2 font-mono ${badgeStyle}`} title={norm.label}>
                                                                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                                            <span>{alertText}</span>
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                                                        {dbl.horas > 0 && (
                                                                            <Badge variant="outline" className={`py-0 px-1 font-mono font-semibold ${
                                                                                dbl.estado === 'rojo' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold' :
                                                                                dbl.estado === 'amarillo' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 font-bold' :
                                                                                'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                                                                            }`} title={`TEX Doble: ${dbl.horas}h`}>
                                                                                TEX 2x: {dbl.horas}h
                                                                            </Badge>
                                                                        )}
                                                                        {trp.horas > 0 && (
                                                                            <Badge variant="outline" className="py-0 px-1 font-mono font-bold bg-rose-600/20 text-rose-700 dark:text-rose-300 border-rose-600/40 animate-pulse" title={`TEX Triple: ${trp.horas}h`}>
                                                                                TEX 3x: {trp.horas}h
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })() : <span className="text-xs text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge variant="outline" className="text-xs font-mono">{emp.conteo_eventos.total} eventos</Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {ultimo && origenBadge ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <Badge variant="outline" className={`capitalize font-normal border text-xs ${origenBadge.class}`}>{origenBadge.label}</Badge>
                                                                    {ultimo.latitud && ultimo.longitud && (
                                                                        <a
                                                                            href={`https://www.google.com/maps?q=${ultimo.latitud},${ultimo.longitud}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            title={`${__('Ver GPS en Google Maps')} (${ultimo.latitud}, ${ultimo.longitud})`}
                                                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-0.5 text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 hover:underline"
                                                                        >
                                                                            <MapPin className="w-3 h-3 text-blue-500" />
                                                                            GPS
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500"><Building2 className="w-3 h-3" /> {ultimo.sucursal?.nombre || __('General')}</div>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right rtl:text-left">
                                                        <Button size="sm" onClick={() => setSelectedEmpleado(emp)} className="h-8 gap-1.5"><Eye className="w-3.5 h-3.5" /> {__('Auditar')}</Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                {marcajes.links && <Pagination paginatedData={marcajes} />}
            </div>

            <Dialog open={!!selectedEmpleado} onOpenChange={(open) => { if (!open) setSelectedEmpleado(null); }}>
                <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            {__('Historial y Auditoría de Bitácora')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {__('Detalle completo de todos los marcajes auditados para el empleado.')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEmpleado && (
                        <div className="space-y-5 pt-2">
                            {/* Card Header de Empleado */}
                            <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-500/10 via-slate-50 dark:via-slate-900 to-purple-500/10 border border-indigo-200 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                                        {`${selectedEmpleado.nombres.charAt(0)}${selectedEmpleado.apellidos.charAt(0)}`.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                            {selectedEmpleado.nombres} {selectedEmpleado.apellidos}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{__('N°')} <span dir="ltr">{selectedEmpleado.documento_identidad}</span></span>
                                            <span>•</span>
                                            <span>{selectedEmpleado.departamento?.nombre || __('General')}</span>
                                            {selectedEmpleado.cargo?.nombre && (
                                                <>
                                                    <span>•</span>
                                                    <span>{selectedEmpleado.cargo.nombre}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/80 dark:bg-slate-800 font-mono text-xs border-indigo-200 px-3 py-1">
                                        {__('Turno:')} {selectedEmpleado.turnoLaboral?.nombre || __('Estándar')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Card de Reforma Laboral & Semáforos LFT */}
                            {selectedEmpleado.semana_lft && (
                                <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 p-4 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-indigo-600" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                                                {__('Jornada Semanal & Semáforos LFT (:inicio al :fin)', { inicio: selectedEmpleado.semana_lft.periodo.inicio, fin: selectedEmpleado.semana_lft.periodo.fin })}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                                                {__('Reforma :ano: :horas h máx', { ano: selectedEmpleado.semana_lft.periodo.ano_reforma, horas: selectedEmpleado.semana_lft.limites.normales })}
                                            </Badge>
                                            <Badge variant="outline" className="text-[11px] font-mono">
                                                {__('Total Semana:')} <strong className="ml-1 rtl:ml-0 rtl:mr-1 font-black"><span dir="ltr">{selectedEmpleado.semana_lft.horas.totales}h</span></strong> / <span dir="ltr">{selectedEmpleado.semana_lft.limites.total}h</span>
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* 3 Semáforos */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Semáforo Normal */}
                                        <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{__('Jornada Ordinaria')}</span>
                                                <Badge variant="outline" className={`text-[10px] font-bold ${
                                                    selectedEmpleado.semana_lft.semaforos.normal.estado === 'rojo' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold' :
                                                    selectedEmpleado.semana_lft.semaforos.normal.estado === 'amarillo' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold' :
                                                    selectedEmpleado.semana_lft.semaforos.normal.estado === 'verde' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {selectedEmpleado.semana_lft.semaforos.normal.estado === 'normal' ? 'OK' : selectedEmpleado.semana_lft.semaforos.normal.estado.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                                                {selectedEmpleado.semana_lft.horas.normales} <span className="text-xs font-normal text-muted-foreground">/ {selectedEmpleado.semana_lft.limites.normales}h</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full ${
                                                        selectedEmpleado.semana_lft.semaforos.normal.estado === 'rojo' ? 'bg-rose-600' :
                                                        selectedEmpleado.semana_lft.semaforos.normal.estado === 'amarillo' ? 'bg-amber-500' :
                                                        selectedEmpleado.semana_lft.semaforos.normal.estado === 'verde' ? 'bg-emerald-500' :
                                                        'bg-indigo-600'
                                                    }`}
                                                    style={{ width: `${Math.min(100, (selectedEmpleado.semana_lft.horas.normales / selectedEmpleado.semana_lft.limites.normales) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {__('Alertas: 42h (RH) • 44h (Resp) • 46h (DG)')}
                                            </p>
                                        </div>

                                        {/* TEX Doble */}
                                        <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{__('TEX Doble (200%)')}</span>
                                                <Badge variant="outline" className={`text-[10px] font-bold ${
                                                    selectedEmpleado.semana_lft.semaforos.tex_doble.estado === 'rojo' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                                                    selectedEmpleado.semana_lft.semaforos.tex_doble.estado === 'amarillo' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                                                    selectedEmpleado.semana_lft.semaforos.tex_doble.estado === 'verde' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {selectedEmpleado.semana_lft.semaforos.tex_doble.estado.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                                                {selectedEmpleado.semana_lft.horas.tex_doble} <span className="text-xs font-normal text-muted-foreground">/ {selectedEmpleado.semana_lft.limites.tex_doble}h</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full ${
                                                        selectedEmpleado.semana_lft.semaforos.tex_doble.estado === 'rojo' ? 'bg-rose-600' :
                                                        selectedEmpleado.semana_lft.semaforos.tex_doble.estado === 'amarillo' ? 'bg-amber-500' :
                                                        'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, (selectedEmpleado.semana_lft.horas.tex_doble / selectedEmpleado.semana_lft.limites.tex_doble) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {__('Umbrales: 7h (Verde) • 8h (Amarillo) • 9h (Rojo)')}
                                            </p>
                                        </div>

                                        {/* TEX Triple */}
                                        <div className="p-2.5 rounded-lg border bg-card space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">{__('TEX Triple (300%)')}</span>
                                                <Badge variant="outline" className={`text-[10px] font-bold ${
                                                    selectedEmpleado.semana_lft.semaforos.tex_triple.estado === 'rojo' ? 'bg-rose-600 text-white border-rose-600 font-bold' :
                                                    selectedEmpleado.semana_lft.semaforos.tex_triple.estado === 'amarillo' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold' :
                                                    selectedEmpleado.semana_lft.semaforos.tex_triple.estado === 'verde' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}>
                                                    {selectedEmpleado.semana_lft.semaforos.tex_triple.estado.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                                                {selectedEmpleado.semana_lft.horas.tex_triple} <span className="text-xs font-normal text-muted-foreground">/ {selectedEmpleado.semana_lft.limites.tex_triple}h</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full ${
                                                        selectedEmpleado.semana_lft.semaforos.tex_triple.estado === 'rojo' ? 'bg-rose-700' :
                                                        selectedEmpleado.semana_lft.semaforos.tex_triple.estado === 'amarillo' ? 'bg-amber-600' :
                                                        'bg-blue-500'
                                                    }`}
                                                    style={{ width: `${Math.min(100, (selectedEmpleado.semana_lft.horas.tex_triple / selectedEmpleado.semana_lft.limites.tex_triple) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {__('Umbrales: 2h (Verde) • 3h (Amarillo) • 4h (Rojo)')}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedEmpleado.semana_lft.semaforos.destinatarios.length > 0 && (
                                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                                                <Bell className="w-3.5 h-3.5" />
                                                <span>{__('Notificaciones escalonadas activas:')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {selectedEmpleado.semana_lft.semaforos.destinatarios.map((dest) => (
                                                    <Badge key={dest} className="bg-rose-600 text-white font-bold text-[10px]">
                                                        {dest === 'RH' ? __('Recursos Humanos (RH)') : dest === 'Responsable' ? __('Supervisor de Sede') : __('Dirección General (DG)')}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timeline de Marcajes Auditados */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                                    {__('Línea de Tiempo de Marcajes (:count eventos)', { count: selectedEmpleado.historial_marcajes.length })}
                                </h4>

                                {selectedEmpleado.historial_marcajes.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl">
                                        {__('No hay eventos registrados para este empleado en el rango seleccionado.')}
                                    </div>
                                ) : (
                                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                        {selectedEmpleado.historial_marcajes.map((m, idx) => {
                                            const badge = getBadgeStyle(m.tipo_marcaje);
                                            const origenBadge = getOrigenBadge(m.origen);
                                            const IconComp = badge.icon;

                                            return (
                                                <div key={m.id} className="relative group">
                                                    {/* Punto en Línea de Tiempo */}
                                                    <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                                    </div>

                                                    {/* Tarjeta del Evento */}
                                                    <div className="rounded-xl border bg-card p-3.5 space-y-2.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-semibold text-xs border ${badge.class}`}>
                                                                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                                                                    <span>{badge.label}</span>
                                                                </Badge>

                                                                {idx === 0 && (
                                                                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
                                                                        {__('Último Evento')}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                                <span>{formatFechaHora(m.fecha_hora)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Metadata: Origen, Sucursal y Evidencia */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="w-3.5 h-3.5" />
                                                                    <strong className="text-slate-700 dark:text-slate-300">{m.sucursal?.nombre || __('General')}</strong>
                                                                </span>
                                                                <span>•</span>
                                                                <Badge variant="outline" className={`text-[10px] font-normal border ${origenBadge.class}`}>
                                                                    {origenBadge.label}
                                                                </Badge>
                                                                {m.latitud && m.longitud ? (
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${m.latitud},${m.longitud}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900"
                                                                    >
                                                                        <MapPin className="w-3.5 h-3.5" /> GPS ({Number(m.latitud).toFixed(4)}, {Number(m.longitud).toFixed(4)})
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3 opacity-40" /> {__('Sin GPS')}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {m.fotografia_path && (
                                                                <a
                                                                    href={`/storage/${m.fotografia_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                                                >
                                                                    <Camera className="w-3.5 h-3.5 rtl:mr-0 rtl:ml-1" /> {__('Ver Evidencia Fotográfica')}
                                                                </a>
                                                            )}
                                                        </div>

                                                        {m.observaciones && (
                                                            <div className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2 rounded-md font-mono text-[11px] mt-1">
                                                                <strong>{__('Obs:')}</strong> {m.observaciones}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
