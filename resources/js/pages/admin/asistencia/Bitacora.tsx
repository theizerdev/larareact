import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Paginated } from '@/types/app';
import Pagination from '@/components/pagination';

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

interface Marcaje {
    id: number;
    empleado_id: number;
    tipo_marcaje: 'entrada' | 'salida_comida' | 'entrada_comida' | 'salida' | 'descanso_inicio' | 'descanso_fin' | 'entrada_extraordinaria';
    fecha_hora: string;
    fecha_hora_iso?: string;
    origen: string;
    fotografia_path?: string | null;
    observaciones?: string | null;
    tiempo_restante_info?: TiempoRestanteInfo;
    empleado: {
        id: number;
        nombres: string;
        apellidos: string;
        documento_identidad: string;
        departamento?: { nombre: string };
        cargo?: { nombre: string };
        turnoLaboral?: { minutos_descanso?: number; nombre?: string };
    };
    sucursal?: { nombre: string };
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
        const suffix = remainingSeconds < 3600 ? ' min restantes' : ' restantes';
        return (
            <div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 px-2.5 py-1 font-semibold text-xs font-mono">
                    <Timer className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" />
                    <span>{formatted}{suffix}</span>
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
        const suffix = excessSeconds < 3600 ? ' min' : '';
        return (
            <div>
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1.5 px-2.5 py-1 font-semibold text-xs font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                    <span>Excedido por {formatted}{suffix}</span>
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

interface Props {
    marcajes: Paginated<Marcaje>;
    stats?: Stats;
    filters: {
        search?: string;
        tipo_marcaje?: string;
        origen?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
        perPage?: number;
    };
}

export default function AsistenciaBitacoraIndex({ marcajes, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [tipoMarcaje, setTipoMarcaje] = useState(filters.tipo_marcaje || 'todos');
    const [origen, setOrigen] = useState(filters.origen || 'todos');
    const [fechaInicio, setFechaInicio] = useState(filters.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filters.fecha_fin || '');
    const [selectedMarcaje, setSelectedMarcaje] = useState<Marcaje | null>(null);

    const formatFechaHora = (fechaStr: string) => {
        if (!fechaStr) return '';
        if (fechaStr.includes('T') || fechaStr.includes('Z')) {
            const dateObj = new Date(fechaStr);
            if (!isNaN(dateObj.getTime())) {
                const datePart = dateObj.toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const timePart = dateObj.toLocaleTimeString('es-MX', {
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
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setTipoMarcaje('todos');
        setOrigen('todos');
        setFechaInicio('');
        setFechaFin('');
        router.get('/admin/asistencia/bitacora', {}, { preserveState: true });
    };

    const setQuickDate = (type: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (type === 'today') {
            start = now;
            end = now;
        } else if (type === 'week') {
            const first = now.getDate() - now.getDay() + 1;
            start = new Date(now.setDate(first));
            end = new Date();
        } else if (type === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date();
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        setFechaInicio(startStr);
        setFechaFin(endStr);

        router.get('/admin/asistencia/bitacora', {
            search: search || undefined,
            tipo_marcaje: tipoMarcaje !== 'todos' ? tipoMarcaje : undefined,
            origen: origen !== 'todos' ? origen : undefined,
            fecha_inicio: startStr,
            fecha_fin: endStr,
        }, { preserveState: true });
    };

    const getBadgeStyle = (tipo: string) => {
        switch (tipo) {
            case 'entrada':
                return { label: 'Entrada', icon: LogIn, class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
            case 'salida_comida':
                return { label: 'Salida Comida', icon: Utensils, class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
            case 'entrada_comida':
                return { label: 'Regreso Comida', icon: Coffee, class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
            case 'salida':
                return { label: 'Salida Final', icon: LogOut, class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
            default:
                return { label: tipo, icon: Clock, class: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
        }
    };

    const getOrigenBadge = (orig: string) => {
        switch (orig.toLowerCase()) {
            case 'garita':
            case 'caseta':
                return { label: 'Caseta / Garita', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
            case 'kiosko':
                return { label: 'Kiosko Táctil', class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
            case 'movil':
            case 'app':
                return { label: 'App Móvil', class: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
            default:
                return { label: orig || 'Sistema', class: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Asistencia y Nómina', href: '/admin/asistencia/calculo-nomina' },
        { title: 'Bitácora de Marcajes', href: '/admin/asistencia/bitacora' },
    ];

    // Total counts fallback
    const totalEvents = stats?.total ?? marcajes.total ?? marcajes.data.length;
    const totalEntradas = stats?.entradas ?? marcajes.data.filter(m => m.tipo_marcaje === 'entrada').length;
    const totalDescansos = stats?.descansos ?? marcajes.data.filter(m => m.tipo_marcaje === 'salida_comida' || m.tipo_marcaje === 'entrada_comida').length;
    const totalSalidas = stats?.salidas ?? marcajes.data.filter(m => m.tipo_marcaje === 'salida').length;

    return (
        <>
            <Head title="Bitácora de Marcajes - Reloj Checador" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header Principal */}
                <ModuleHeader
                    icon={<Clock className="h-6 w-6 text-white" />}
                    title="Bitácora de Marcajes"
                    description="Historial completo de accesos, checadas y tiempos de descanso auditados en tiempo real."
                    colorClassName="bg-indigo-600"
                />

                {/* Tarjetas KPI de Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<ListOrdered className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                        title="Eventos Auditados"
                        value={totalEvents}
                        colorClassName="bg-indigo-100 dark:bg-indigo-900/30"
                    />
                    <StatCard
                        icon={<LogIn className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        title="Entradas de Jornada"
                        value={totalEntradas}
                        colorClassName="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                    <StatCard
                        icon={<Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        title="Descansos / Comidas"
                        value={totalDescansos}
                        colorClassName="bg-amber-100 dark:bg-amber-900/30"
                    />
                    <StatCard
                        icon={<LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                        title="Salidas Finales"
                        value={totalSalidas}
                        colorClassName="bg-rose-100 dark:bg-rose-900/30"
                    />
                </div>

                {/* Barra de Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4 w-full">
                        <FilterField label="Empleado o Código">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre, documento..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </FilterField>

                        <FilterField label="Tipo de Marcaje">
                            <Select value={tipoMarcaje} onValueChange={setTipoMarcaje}>
                                <SelectTrigger className="w-full sm:w-44">
                                    <SelectValue placeholder="Tipo Marcaje" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los eventos</SelectItem>
                                    <SelectItem value="entrada">Entradas</SelectItem>
                                    <SelectItem value="salida_comida">Salida a Comida</SelectItem>
                                    <SelectItem value="entrada_comida">Regreso de Comida</SelectItem>
                                    <SelectItem value="salida">Salida Final</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Origen del Marcaje">
                            <Select value={origen} onValueChange={setOrigen}>
                                <SelectTrigger className="w-full sm:w-44">
                                    <SelectValue placeholder="Origen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los orígenes</SelectItem>
                                    <SelectItem value="kiosko">Kiosko Táctil</SelectItem>
                                    <SelectItem value="garita">Caseta / Garita</SelectItem>
                                    <SelectItem value="movil">App Móvil</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Desde">
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full sm:w-36"
                            />
                        </FilterField>

                        <FilterField label="Hasta">
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full sm:w-36"
                            />
                        </FilterField>

                        <div className="flex items-center gap-2">
                            <Button onClick={handleFilter} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Filtrar
                            </Button>
                            <Button variant="outline" onClick={handleReset} title="Limpiar Filtros">
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex items-center gap-2 pt-3 border-t border-muted/50 text-xs text-muted-foreground">
                        <span className="font-medium">Accesos rápidos:</span>
                        <button
                            onClick={() => setQuickDate('today')}
                            className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium"
                        >
                            Hoy
                        </button>
                        <span>•</span>
                        <button
                            onClick={() => setQuickDate('week')}
                            className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium"
                        >
                            Esta Semana
                        </button>
                        <span>•</span>
                        <button
                            onClick={() => setQuickDate('month')}
                            className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium"
                        >
                            Este Mes
                        </button>
                    </div>
                </FilterBar>

                {/* Tabla de Registros Auditados */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            <CardTitle className="text-base font-semibold">
                                Registros Auditados de Asistencia
                            </CardTitle>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {marcajes.total || marcajes.data.length} registros
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-3.5">Empleado</th>
                                        <th className="px-4 py-3.5">Evento / Marcaje</th>
                                        <th className="px-4 py-3.5">Fecha y Hora</th>
                                        <th className="px-4 py-3.5">Tiempo Restante / Estado</th>
                                        <th className="px-4 py-3.5">Origen / Canal</th>
                                        <th className="px-4 py-3.5">Sucursal</th>
                                        <th className="px-4 py-3.5 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {marcajes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium">No se encontraron marcajes en la bitácora.</p>
                                                <p className="text-xs text-muted-foreground mt-1">Prueba cambiando los filtros de fecha o búsqueda.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        marcajes.data.map((m) => {
                                            const badge = getBadgeStyle(m.tipo_marcaje);
                                            const origenBadge = getOrigenBadge(m.origen);
                                            const IconComp = badge.icon;
                                            const infoTiempo = m.tiempo_restante_info;
                                            
                                            // Avatar Initials
                                            const initials = `${m.empleado.nombres.charAt(0)}${m.empleado.apellidos.charAt(0)}`.toUpperCase();

                                            return (
                                                <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-600/20">
                                                                {initials}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                                    {m.empleado.nombres} {m.empleado.apellidos}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                    <span className="font-mono font-medium">N° {m.empleado.documento_identidad}</span>
                                                                    <span>•</span>
                                                                    <span>{m.empleado.departamento?.nombre || 'General'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <Badge className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-medium border ${badge.class}`}>
                                                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                                                            <span>{badge.label}</span>
                                                        </Badge>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                            {formatFechaHora(m.fecha_hora)}
                                                        </div>
                                                    </td>

                                                    {/* Renglon de Tiempo Restante según tiempo establecido (Tiempo Real) */}
                                                    <td className="px-4 py-3.5">
                                                        {infoTiempo ? (
                                                            <div className="space-y-0.5">
                                                                {(infoTiempo.estado === 'en_curso' || infoTiempo.estado === 'excedido') ? (
                                                                    <LiveBreakTimer 
                                                                        fechaHora={m.fecha_hora} 
                                                                        fechaHoraIso={m.fecha_hora_iso}
                                                                        limiteMinutos={infoTiempo.limite_minutos ?? 15}
                                                                        subtexto={infoTiempo.subtexto}
                                                                    />
                                                                ) : infoTiempo.estado === 'completado' ? (
                                                                    <div>
                                                                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 gap-1.5 px-2.5 py-1 font-medium text-xs">
                                                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                                            <span>{infoTiempo.texto}</span>
                                                                        </Badge>
                                                                        {infoTiempo.subtexto && (
                                                                            <div className="text-[11px] text-muted-foreground mt-1">
                                                                                {infoTiempo.subtexto}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1">
                                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                                        <span>{infoTiempo.texto}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <Badge variant="outline" className={`capitalize font-normal border ${origenBadge.class}`}>
                                                            {origenBadge.label}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>{m.sucursal?.nombre || 'Matriz'}</span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSelectedMarcaje(m)}
                                                            className="h-8 px-2.5 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Auditar</span>
                                                        </Button>
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

                {/* Paginación */}
                {marcajes.links && <Pagination paginatedData={marcajes} />}
            </div>

            {/* Modal de Detalle de Auditoría de Marcaje */}
            <Dialog open={!!selectedMarcaje} onOpenChange={(open) => { if (!open) setSelectedMarcaje(null); }}>
                <DialogContent className="max-w-md w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            Detalle del Registro de Asistencia
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Auditoría de marcaje N° #{selectedMarcaje?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMarcaje && (
                        <div className="space-y-4 pt-2">
                            {/* Fotografía de Marcaje si existe */}
                            {selectedMarcaje.fotografia_path ? (
                                <div className="rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 text-center">
                                    <img
                                        src={`/storage/${selectedMarcaje.fotografia_path}`}
                                        alt="Captura de marcaje"
                                        className="w-full h-48 object-cover"
                                    />
                                    <span className="text-[10px] text-muted-foreground p-1 block flex items-center justify-center gap-1">
                                        <Camera className="w-3 h-3" /> Evidencia Fotográfica Capturada
                                    </span>
                                </div>
                            ) : (
                                <div className="rounded-xl p-4 border bg-muted/30 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                                    <Camera className="w-5 h-5 opacity-40" />
                                    <span>Sin evidencia fotográfica requerida</span>
                                </div>
                            )}

                            {/* Información del Empleado */}
                            <div className="rounded-xl p-3.5 bg-muted/40 border space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Empleado:</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                        {selectedMarcaje.empleado.nombres} {selectedMarcaje.empleado.apellidos}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">N° Empleado:</span>
                                    <span className="font-mono font-medium">{selectedMarcaje.empleado.documento_identidad}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Departamento:</span>
                                    <span>{selectedMarcaje.empleado.departamento?.nombre || 'General'}</span>
                                </div>
                            </div>

                            {/* Detalle del Marcaje */}
                            <div className="space-y-2 text-xs border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Evento:</span>
                                    <Badge className={`border ${getBadgeStyle(selectedMarcaje.tipo_marcaje).class}`}>
                                        {getBadgeStyle(selectedMarcaje.tipo_marcaje).label}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Fecha y Hora:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {formatFechaHora(selectedMarcaje.fecha_hora)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Origen:</span>
                                    <Badge variant="outline" className="capitalize">
                                        {getOrigenBadge(selectedMarcaje.origen).label}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Sucursal:</span>
                                    <span>{selectedMarcaje.sucursal?.nombre || 'Matriz'}</span>
                                </div>
                                {selectedMarcaje.tiempo_restante_info && (
                                    <div className="flex items-center justify-between pt-1.5 border-t border-dashed">
                                        <span className="text-muted-foreground">Estado / Tiempo Restante:</span>
                                        <div>
                                            {(selectedMarcaje.tiempo_restante_info.estado === 'en_curso' || selectedMarcaje.tiempo_restante_info.estado === 'excedido') ? (
                                                <LiveBreakTimer 
                                                    fechaHora={selectedMarcaje.fecha_hora} 
                                                    fechaHoraIso={selectedMarcaje.fecha_hora_iso}
                                                    limiteMinutos={selectedMarcaje.tiempo_restante_info.limite_minutos ?? 15}
                                                />
                                            ) : (
                                                <span className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                                                    {selectedMarcaje.tiempo_restante_info.texto}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {selectedMarcaje.observaciones && (
                                    <div className="pt-2 border-t mt-2">
                                        <span className="text-muted-foreground block mb-1">Observaciones:</span>
                                        <p className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2 rounded-md font-mono text-[11px]">
                                            {selectedMarcaje.observaciones}
                                        </p>
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
