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

interface MarcajeIndividual {
    id: number;
    empleado_id: number;
    tipo_marcaje: 'entrada' | 'salida_comida' | 'entrada_comida' | 'salida' | 'descanso_inicio' | 'descanso_fin' | 'entrada_extraordinaria';
    fecha_hora: string;
    fecha_hora_iso?: string;
    origen: string;
    fotografia_path?: string | null;
    observaciones?: string | null;
    sucursal?: { nombre: string };
}

interface EmpleadoBitacora {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    departamento?: { nombre: string };
    cargo?: { nombre: string };
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
    marcajes: Paginated<EmpleadoBitacora>;
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
    const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoBitacora | null>(null);

    const formatFechaHora = (fechaStr?: string) => {
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
                return { label: 'Entrada', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: LogIn };
            case 'salida_comida':
                return { label: 'Salida Comida', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Utensils };
            case 'entrada_comida':
                return { label: 'Regreso Comida', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Utensils };
            case 'descanso_inicio':
                return { label: 'Descanso Inicio', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Coffee };
            case 'descanso_fin':
                return { label: 'Descanso Fin', class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: Coffee };
            case 'salida':
                return { label: 'Salida', class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: LogOut };
            case 'entrada_extraordinaria':
                return { label: 'Entrada Extra', class: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', icon: LogIn };
            default:
                return { label: tipo, class: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: Clock };
        }
    };

    const getOrigenBadge = (origenStr: string) => {
        switch (origenStr) {
            case 'kiosko_tactil':
            case 'kiosko':
            case 'reloj_checador':
                return { label: 'Reloj Checador', class: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200' };
            case 'garita':
                return { label: 'Garita Acceso', class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' };
            case 'app_movil':
                return { label: 'App Móvil', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' };
            case 'reconocimiento_facial':
                return { label: 'Facial AI', class: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200' };
            case 'manual_admin':
                return { label: 'Manual Admin', class: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' };
            default:
                return { label: origenStr, class: 'bg-gray-50 text-gray-700 border-gray-200' };
        }
    };

    return (
        <>
            <Head title="Bitácora de Asistencia" />

            <div className="space-y-6">
                <Breadcrumbs
                    breadcrumbs={[
                        { title: 'Asistencia', href: '/admin/asistencia' },
                        { title: 'Bitácora de Marcajes', href: '/admin/asistencia/bitacora' },
                    ]}
                />

                <ModuleHeader
                    title="Bitácora de Asistencia por Empleado"
                    description="Supervisión agrupada de marcajes, descansos de Ley Silla y almuerzos en tiempo real."
                    icon={<Clock className="h-6 w-6 text-white" />}
                    colorClassName="bg-indigo-600"
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Marcajes Auditados"
                        value={stats?.total ?? marcajes.total}
                        icon={<Clock className="w-5 h-5 text-indigo-600" />}
                        colorClassName="bg-indigo-100 dark:bg-indigo-900/30"
                    />
                    <StatCard
                        title="Entradas Registradas"
                        value={stats?.entradas ?? 0}
                        icon={<LogIn className="w-5 h-5 text-emerald-600" />}
                        colorClassName="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                    <StatCard
                        title="Descansos / Almuerzos"
                        value={stats?.descansos ?? 0}
                        icon={<Coffee className="w-5 h-5 text-purple-600" />}
                        colorClassName="bg-purple-100 dark:bg-purple-900/30"
                    />
                    <StatCard
                        title="Salidas Registradas"
                        value={stats?.salidas ?? 0}
                        icon={<LogOut className="w-5 h-5 text-rose-600" />}
                        colorClassName="bg-rose-100 dark:bg-rose-900/30"
                    />
                </div>

                <FilterBar>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full">
                        <FilterField label="Buscar Empleado">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre o N° Empleado..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-xs"
                                />
                            </div>
                        </FilterField>

                        <FilterField label="Tipo de Marcaje">
                            <Select value={tipoMarcaje} onValueChange={setTipoMarcaje}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Todos los eventos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los eventos</SelectItem>
                                    <SelectItem value="entrada">Entradas</SelectItem>
                                    <SelectItem value="salida_comida">Salidas a Comida</SelectItem>
                                    <SelectItem value="entrada_comida">Regresos de Comida</SelectItem>
                                    <SelectItem value="descanso_inicio">Inicio Descanso Ley Silla</SelectItem>
                                    <SelectItem value="descanso_fin">Fin Descanso Ley Silla</SelectItem>
                                    <SelectItem value="salida">Salidas</SelectItem>
                                    <SelectItem value="entrada_extraordinaria">Entrada Extra</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Origen / Dispositivo">
                            <Select value={origen} onValueChange={setOrigen}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Todos los orígenes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los orígenes</SelectItem>
                                    <SelectItem value="kiosko_tactil">Reloj Checador</SelectItem>
                                    <SelectItem value="garita">Garita de Acceso</SelectItem>
                                    <SelectItem value="app_movil">App Móvil</SelectItem>
                                    <SelectItem value="reconocimiento_facial">Facial AI</SelectItem>
                                    <SelectItem value="manual_admin">Manual Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Fecha Inicio">
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="text-xs"
                            />
                        </FilterField>

                        <FilterField label="Fecha Fin">
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="text-xs"
                            />
                        </FilterField>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-muted/50 text-xs text-muted-foreground">
                        <span className="font-medium">Accesos rápidos:</span>
                        <button onClick={() => setQuickDate('today')} className="hover:underline text-indigo-600 font-medium">Hoy</button>
                        <span>•</span>
                        <button onClick={() => setQuickDate('week')} className="hover:underline text-indigo-600 font-medium">Esta Semana</button>
                        <span>•</span>
                        <button onClick={() => setQuickDate('month')} className="hover:underline text-indigo-600 font-medium">Este Mes</button>
                        <Button size="sm" onClick={handleFilter} className="ml-auto bg-indigo-600 h-7 text-xs">Filtrar</Button>
                        <Button size="sm" variant="outline" onClick={handleReset} className="h-7"><RotateCcw className="w-3.5 h-3.5" /></Button>
                    </div>
                </FilterBar>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            <CardTitle className="text-base font-semibold">Bitácora de Asistencia por Empleado</CardTitle>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {marcajes.total || marcajes.data.length} empleados auditados
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-4 py-3.5">Empleado</th>
                                        <th className="px-4 py-3.5">Último Evento</th>
                                        <th className="px-4 py-3.5">Estado / Tiempo Restante</th>
                                        <th className="px-4 py-3.5">Eventos en Período</th>
                                        <th className="px-4 py-3.5">Origen & Sucursal</th>
                                        <th className="px-4 py-3.5 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {marcajes.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium">No se encontraron empleados con marcajes en el período.</p>
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
                                                                    <span className="font-mono font-medium">N° {emp.documento_identidad}</span>
                                                                    <span>•</span>
                                                                    <span>{emp.departamento?.nombre || 'General'}</span>
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
                                                            <LiveBreakTimer fechaHora={ultimo.fecha_hora} fechaHoraIso={ultimo.fecha_hora_iso} limiteMinutos={infoTiempo.limite_minutos ?? 15} subtexto={infoTiempo.subtexto} />
                                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge variant="outline" className="text-xs font-mono">{emp.conteo_eventos.total} eventos</Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {ultimo && origenBadge ? (
                                                            <div className="space-y-1">
                                                                <Badge variant="outline" className={`capitalize font-normal border text-xs ${origenBadge.class}`}>{origenBadge.label}</Badge>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500"><Building2 className="w-3 h-3" /> {ultimo.sucursal?.nombre || 'Matriz'}</div>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <Button size="sm" onClick={() => setSelectedEmpleado(emp)} className="h-8 gap-1.5"><Eye className="w-3.5 h-3.5" /> Auditar</Button>
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
                            Historial y Auditoría de Bitácora
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Detalle completo de todos los marcajes auditados para el empleado.
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
                                            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">N° {selectedEmpleado.documento_identidad}</span>
                                            <span>•</span>
                                            <span>{selectedEmpleado.departamento?.nombre || 'General'}</span>
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
                                        Turno: {selectedEmpleado.turnoLaboral?.nombre || 'Estándar'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Timeline de Marcajes Auditados */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                                    Línea de Tiempo de Marcajes ({selectedEmpleado.historial_marcajes.length} eventos)
                                </h4>

                                {selectedEmpleado.historial_marcajes.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl">
                                        No hay eventos registrados para este empleado en el rango seleccionado.
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
                                                                        Último Evento
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
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="w-3.5 h-3.5" />
                                                                    <strong className="text-slate-700 dark:text-slate-300">{m.sucursal?.nombre || 'Matriz'}</strong>
                                                                </span>
                                                                <span>•</span>
                                                                <Badge variant="outline" className={`text-[10px] font-normal border ${origenBadge.class}`}>
                                                                    {origenBadge.label}
                                                                </Badge>
                                                            </div>

                                                            {m.fotografia_path && (
                                                                <a
                                                                    href={`/storage/${m.fotografia_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                                                >
                                                                    <Camera className="w-3.5 h-3.5" /> Ver Evidencia Fotográfica
                                                                </a>
                                                            )}
                                                        </div>

                                                        {m.observaciones && (
                                                            <div className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2 rounded-md font-mono text-[11px] mt-1">
                                                                <strong>Obs:</strong> {m.observaciones}
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
