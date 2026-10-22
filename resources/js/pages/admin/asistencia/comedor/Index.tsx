import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Utensils,
    Plus,
    CheckCircle,
    XCircle,
    Pencil,
    Trash2,
    Clock,
    Coffee,
    Moon,
    Apple,
    Sandwich,
    DollarSign,
    Building2,
    Eye,
    Sparkles,
    Search,
    SlidersHorizontal,
    RotateCcw,
    Store,
    FileSpreadsheet,
    Calendar,
    Download,
    Receipt
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { notifySuccess, notifyError } from '@/utils/notifications';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ProveedorItem {
    id: number;
    nombre_comercial: string;
    razon_social: string;
    rfc?: string | null;
    sucursal_id?: number | null;
}

export interface OpcionComidaItem {
    id: number;
    empresa_id: number;
    sucursal_id?: number | null;
    proveedor_id?: number | null;
    nombre: string;
    tipo: 'desayuno' | 'almuerzo' | 'cena' | 'refrigerio';
    descripcion?: string | null;
    costo_empleado: number | string;
    costo_empresa: number | string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    dias_disponibles?: string[] | null;
    icono: string;
    color: string;
    orden: number;
    status: boolean;
    sucursal?: { id: number; nombre: string } | null;
    proveedor?: ProveedorItem | null;
}

interface SucursalItem {
    id: number;
    nombre: string;
    empresa_id: number;
}

interface Props {
    opciones: {
        data: OpcionComidaItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        desayuno: number;
        almuerzo: number;
        cena: number;
        refrigerio: number;
    };
    tipos: Record<string, string>;
    sucursales: SucursalItem[];
    proveedores?: ProveedorItem[];
    sucursal_usuario?: {
        id: number;
        nombre: string;
        empresa_id?: number;
    } | null;
    filters: {
        search?: string;
        tipo?: string;
        status?: string;
        sucursal_id?: string;
        proveedor_id?: string;
    };
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ComedorIndex({ opciones, stats, tipos, sucursales, proveedores = [], sucursal_usuario, filters }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<OpcionComidaItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<OpcionComidaItem | null>(null);

    // Filtros locales
    const [search, setSearch] = useState(filters.search || '');
    const [tipoFilter, setTipoFilter] = useState(filters.tipo || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status !== undefined ? String(filters.status) : 'all');
    const [sucursalFilter, setSucursalFilter] = useState(filters.sucursal_id || 'all');
    const [proveedorFilter, setProveedorFilter] = useState(filters.proveedor_id || 'all');

    // Formulario de Creación / Edición
    const form = useForm({
        nombre: '',
        tipo: 'almuerzo',
        descripcion: '',
        costo_empleado: '0',
        costo_empresa: '0',
        hora_inicio: '',
        hora_fin: '',
        icono: 'utensils',
        color: 'emerald',
        orden: 1,
        status: true,
        sucursal_id: sucursal_usuario?.id ? String(sucursal_usuario.id) : '',
        proveedor_id: '',
    });

    const activeModalSucursalId = form.data.sucursal_id
        ? Number(form.data.sucursal_id)
        : (sucursal_usuario?.id ?? null);

    const proveedoresFiltradosModal = React.useMemo(() => {
        if (!activeModalSucursalId) return proveedores;
        return proveedores.filter((p) => !p.sucursal_id || p.sucursal_id === activeModalSucursalId);
    }, [proveedores, activeModalSucursalId]);

    // Modal de Reporte de Liquidación a Proveedores
    const [isReportOpen, setIsReportOpen] = useState(false);
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [reportFechaInicio, setReportFechaInicio] = useState(firstDayMonthStr);
    const [reportFechaFin, setReportFechaFin] = useState(todayStr);
    const [reportProveedorId, setReportProveedorId] = useState(proveedorFilter !== 'all' ? proveedorFilter : 'all');
    const [reportSucursalId, setReportSucursalId] = useState(sucursalFilter !== 'all' ? sucursalFilter : (sucursal_usuario?.id ? String(sucursal_usuario.id) : 'all'));
    const [reportTipo, setReportTipo] = useState('all');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleOpenReport = (presetProveedorId?: string) => {
        if (presetProveedorId && presetProveedorId !== 'all') {
            setReportProveedorId(presetProveedorId);
        } else if (proveedorFilter !== 'all') {
            setReportProveedorId(proveedorFilter);
        }
        setIsReportOpen(true);
    };

    const handleSetDateRange = (preset: 'quincena' | 'mes_actual' | 'mes_anterior' | '30dias') => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();

        if (preset === 'quincena') {
            if (d <= 15) {
                const f1 = new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
                const f2 = new Date(Date.UTC(y, m, 15)).toISOString().split('T')[0];
                setReportFechaInicio(f1);
                setReportFechaFin(f2);
            } else {
                const f1 = new Date(Date.UTC(y, m, 16)).toISOString().split('T')[0];
                const f2 = new Date(Date.UTC(y, m + 1, 0)).toISOString().split('T')[0];
                setReportFechaInicio(f1);
                setReportFechaFin(f2);
            }
        } else if (preset === 'mes_actual') {
            const f1 = new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
            setReportFechaInicio(f1);
            setReportFechaFin(todayStr);
        } else if (preset === 'mes_anterior') {
            const firstPrev = new Date(Date.UTC(y, m - 1, 1)).toISOString().split('T')[0];
            const lastPrev = new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0];
            setReportFechaInicio(firstPrev);
            setReportFechaFin(lastPrev);
        } else if (preset === '30dias') {
            const past30 = new Date();
            past30.setDate(past30.getDate() - 30);
            setReportFechaInicio(past30.toISOString().split('T')[0]);
            setReportFechaFin(todayStr);
        }
    };

    const handleDownloadExcel = () => {
        setIsDownloading(true);
        const params = new URLSearchParams();
        if (reportFechaInicio) params.append('fecha_inicio', reportFechaInicio);
        if (reportFechaFin) params.append('fecha_fin', reportFechaFin);
        if (reportProveedorId && reportProveedorId !== 'all') params.append('proveedor_id', reportProveedorId);
        if (reportSucursalId && reportSucursalId !== 'all') params.append('sucursal_id', reportSucursalId);
        if (reportTipo && reportTipo !== 'all') params.append('tipo', reportTipo);

        window.location.href = `/admin/asistencia/comedor/reporte/liquidacion?${params.toString()}`;

        setTimeout(() => {
            setIsDownloading(false);
            notifySuccess('Se ha iniciado la descarga del reporte de liquidación en Excel (.xlsx).');
            setIsReportOpen(false);
        }, 1200);
    };

    const handleApplyFilters = () => {
        router.get('/admin/asistencia/comedor', {
            search: search || undefined,
            tipo: tipoFilter !== 'all' ? tipoFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            sucursal_id: sucursalFilter !== 'all' ? sucursalFilter : undefined,
            proveedor_id: proveedorFilter !== 'all' ? proveedorFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        setSearch('');
        setTipoFilter('all');
        setStatusFilter('all');
        setSucursalFilter('all');
        setProveedorFilter('all');
        router.get('/admin/asistencia/comedor', {}, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        form.setData({
            nombre: '',
            tipo: 'almuerzo',
            descripcion: '',
            costo_empleado: '0',
            costo_empresa: '0',
            hora_inicio: '',
            hora_fin: '',
            icono: 'utensils',
            color: 'emerald',
            orden: (opciones.data.length || 0) + 1,
            status: true,
            sucursal_id: sucursal_usuario?.id ? String(sucursal_usuario.id) : '',
            proveedor_id: '',
        });
        form.clearErrors();
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (item: OpcionComidaItem) => {
        setEditingItem(item);
        form.setData({
            nombre: item.nombre,
            tipo: item.tipo,
            descripcion: item.descripcion || '',
            costo_empleado: String(item.costo_empleado),
            costo_empresa: String(item.costo_empresa),
            hora_inicio: item.hora_inicio ? item.hora_inicio.slice(0, 5) : '',
            hora_fin: item.hora_fin ? item.hora_fin.slice(0, 5) : '',
            icono: item.icono || 'utensils',
            color: item.color || 'amber',
            orden: item.orden,
            status: item.status,
            sucursal_id: item.sucursal_id ? String(item.sucursal_id) : '',
            proveedor_id: item.proveedor_id ? String(item.proveedor_id) : '',
        });
        form.clearErrors();
        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form.data,
            sucursal_id: form.data.sucursal_id ? Number(form.data.sucursal_id) : (sucursal_usuario?.id ?? null),
            proveedor_id: form.data.proveedor_id ? Number(form.data.proveedor_id) : null,
            costo_empleado: Number(form.data.costo_empleado) || 0,
            costo_empresa: Number(form.data.costo_empresa) || 0,
            hora_inicio: form.data.hora_inicio || null,
            hora_fin: form.data.hora_fin || null,
        };

        if (editingItem) {
            form.put(`/admin/asistencia/comedor/${editingItem.id}`, {
                ...payload,
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setEditingItem(null);
                    notifySuccess('Opción de comida actualizada correctamente.');
                },
                onError: () => notifyError('Revise los errores en el formulario.'),
            });
        } else {
            form.post('/admin/asistencia/comedor', {
                ...payload,
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    notifySuccess('Opción de comida registrada con éxito.');
                },
                onError: () => notifyError('Revise los errores en el formulario.'),
            });
        }
    };

    const handleToggleStatus = (item: OpcionComidaItem) => {
        router.patch(`/admin/asistencia/comedor/${item.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => notifySuccess(`Opción ${!item.status ? 'activada' : 'desactivada'} correctamente.`),
            onError: () => notifyError('No fue posible cambiar el estado.'),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingItem) return;
        router.delete(`/admin/asistencia/comedor/${deletingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingItem(null);
                notifySuccess('Opción de comida eliminada correctamente.');
            },
            onError: () => notifyError('No se pudo eliminar la opción seleccionada.'),
        });
    };

    // Helper de Íconos
    const renderIconPreview = (icono: string, className = 'w-5 h-5') => {
        switch (icono) {
            case 'coffee': return <Coffee className={className} />;
            case 'moon': return <Moon className={className} />;
            case 'apple': return <Apple className={className} />;
            case 'sandwich': return <Sandwich className={className} />;
            default: return <Utensils className={className} />;
        }
    };

    // Helper de Badges de Tipo
    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'desayuno':
                return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5"><Coffee className="w-3 h-3" /> Desayuno</Badge>;
            case 'almuerzo':
                return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5"><Utensils className="w-3 h-3" /> Almuerzo</Badge>;
            case 'cena':
                return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5"><Moon className="w-3 h-3" /> Cena</Badge>;
            case 'refrigerio':
                return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5"><Apple className="w-3 h-3" /> Refrigerio</Badge>;
            default:
                return <Badge variant="outline">{tipo}</Badge>;
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kiosko Checador', href: '/admin/reloj-checador/kiosko' },
        { title: 'Opciones de Comedor', href: '/admin/asistencia/comedor' },
    ];

    return (
        <>
            <Head title="Opciones de Comedor & Menús" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Utensils className="h-6 w-6 text-white" />}
                    title="Opciones de Comedor y Menús"
                    description="Catálogo dinámico de tiempos de comida (Desayuno, Almuerzo, Cena, Refrigerio), costos al colaborador, subsidios y horarios disponibles en el Kiosko Checador."
                    colorClassName="bg-slate-900 dark:bg-slate-800"
                >
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            onClick={() => handleOpenReport()}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 shadow-sm backdrop-blur-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            <span>Reporte de Liquidación</span>
                        </Button>
                        <Button onClick={handleOpenCreate} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>Nueva Opción de Comida</span>
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <StatCard
                        icon={<Utensils className="h-5 w-5" />}
                        title="TOTAL OPCIONES"
                        value={stats.total}
                        colorClassName="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <StatCard
                        icon={<Coffee className="h-5 w-5" />}
                        title="DESAYUNOS"
                        value={stats.desayuno}
                        colorClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<Utensils className="h-5 w-5" />}
                        title="ALMUERZOS"
                        value={stats.almuerzo}
                        colorClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<Moon className="h-5 w-5" />}
                        title="CENAS"
                        value={stats.cena}
                        colorClassName="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<Apple className="h-5 w-5" />}
                        title="REFRIGERIOS"
                        value={stats.refrigerio}
                        colorClassName="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
                    />
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Buscar por nombre o descripción</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ej. Desayuno Continental, Menú Corrido..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-44 space-y-1">
                                <Label className="text-xs text-muted-foreground">Tipo de Comida</Label>
                                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        <SelectItem value="desayuno">Desayuno</SelectItem>
                                        <SelectItem value="almuerzo">Almuerzo / Comida</SelectItem>
                                        <SelectItem value="cena">Cena</SelectItem>
                                        <SelectItem value="refrigerio">Refrigerio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-36 space-y-1">
                                <Label className="text-xs text-muted-foreground">Estado</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="1">Activos</SelectItem>
                                        <SelectItem value="0">Inactivos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {sucursales.length > 0 && (
                                <div className="w-full md:w-48 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Sucursal / Planta</Label>
                                    <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las sucursales" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las plantas</SelectItem>
                                            {sucursales.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {proveedores.length > 0 && (
                                <div className="w-full md:w-52 space-y-1">
                                    <Label className="text-xs text-muted-foreground">Proveedor de Alimentos</Label>
                                    <Select value={proveedorFilter} onValueChange={setProveedorFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los proveedores" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los proveedores</SelectItem>
                                            {proveedores.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.nombre_comercial}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleApplyFilters} className="gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>Filtrar</span>
                                </Button>
                                <Button variant="outline" onClick={handleResetFilters} title="Limpiar Filtros">
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                                {proveedorFilter !== 'all' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOpenReport(proveedorFilter)}
                                        className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                                        title="Generar reporte de liquidación para el proveedor seleccionado"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span className="hidden sm:inline">Liquidación Proveedor</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Opciones */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-amber-500" />
                                Catálogo de Opciones ({opciones.data.length})
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Las opciones activas se desplegarán de forma inmediata en el Kiosko Checador táctil cuando los colaboradores marquen INICIO COMIDA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-14 text-center">Orden</TableHead>
                                        <TableHead>Nombre & Detalle</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Horario de Servicio</TableHead>
                                        <TableHead className="text-right">Costo Colaborador (MXN)</TableHead>
                                        <TableHead className="text-right">Costo Proveedor (MXN)</TableHead>
                                        <TableHead>Planta / Sucursal</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right w-24">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {opciones.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Utensils className="w-8 h-8 text-muted-foreground/50" />
                                                    <p className="font-medium text-sm">No se encontraron opciones de comida registradas.</p>
                                                    <Button size="sm" variant="outline" onClick={handleOpenCreate} className="mt-2">
                                                        <Plus className="w-4 h-4 mr-1" /> Registrar primera opción
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        opciones.data.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/30">
                                                <TableCell className="text-center font-mono font-bold text-xs text-muted-foreground">
                                                    #{item.orden}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 shrink-0`}>
                                                            {renderIconPreview(item.icono, 'w-5 h-5 text-amber-400')}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                                                {item.nombre}
                                                            </div>
                                                            {item.descripcion && (
                                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                                    {item.descripcion}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getTipoBadge(item.tipo)}
                                                </TableCell>
                                                <TableCell>
                                                    {item.hora_inicio && item.hora_fin ? (
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                            <span>{item.hora_inicio.slice(0, 5)} - {item.hora_fin.slice(0, 5)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Todo el día</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    {Number(item.costo_empleado) > 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            ${Number(item.costo_empleado).toFixed(2)} MXN
                                                        </span>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                                            Sin costo
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                    {Number(item.costo_empresa) > 0 ? `$${Number(item.costo_empresa).toFixed(2)} MXN` : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.sucursal ? (
                                                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                                            <Building2 className="w-3 h-3 text-slate-400" />
                                                            {item.sucursal.nombre}
                                                        </span>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                                                            Global
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.proveedor ? (
                                                        <span className="text-xs flex items-center gap-1.5 font-medium text-foreground">
                                                            <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            <span className="truncate max-w-[140px]" title={`${item.proveedor.nombre_comercial} (${item.proveedor.razon_social})`}>
                                                                {item.proveedor.nombre_comercial}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            Interno
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center">
                                                        <Switch
                                                            checked={item.status}
                                                            onCheckedChange={() => handleToggleStatus(item)}
                                                            title={item.status ? 'Activo (visible en kiosko)' : 'Inactivo (oculto en kiosko)'}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            title="Editar opción"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setDeletingItem(item)}
                                                            className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                                            title="Eliminar opción"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── MODAL DE CREACIÓN / EDICIÓN (AMPLIADO A TAMAÑO EXTRA GRANDE) ─────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[95vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl">
                    <DialogHeader className="pb-3 border-b border-border/60">
                        <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <span>{editingItem ? 'Editar Opción de Comida' : 'Nueva Opción de Comida (Catálogo México)'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                            Configure los datos del alimento mexicano, su horario de servicio para el Kiosko y los costos en Pesos Mexicanos (MXN).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-3">
                        {/* BANNER INFORMATIVO: SEDE / SUCURSAL DEL MENÚ (SUCURSAL DEL USUARIO AUTENTICADO) */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 dark:bg-blue-950/30">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Sede / Sucursal del Menú:
                                        </span>
                                        <Badge className="bg-blue-600 text-white dark:bg-blue-500 font-bold text-xs px-2.5 py-0.5">
                                            {editingItem?.sucursal?.nombre || sucursal_usuario?.nombre || 'Planta Principal (Smurfit México)'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] bg-background text-blue-600 dark:text-blue-400 border-blue-500/30">
                                            {editingItem ? 'Sede Asignada' : 'Sucursal de tu Usuario Autenticado'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {editingItem
                                            ? `Menú asignado a ${editingItem.sucursal ? editingItem.sucursal.nombre : 'todas las plantas'}.`
                                            : `Este menú se asocia automáticamente a tu sucursal actual (${sucursal_usuario?.nombre || 'Planta Principal'}) para el Kiosko Checador.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* COLUMNA IZQUIERDA (7 columnas): DATOS PRINCIPALES Y COSTOS */}
                            <div className="lg:col-span-7 space-y-5">
                                <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Utensils className="w-3.5 h-3.5 text-amber-500" /> 1. Datos del Alimento / Platillo
                                    </h3>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombre" className="text-xs font-bold">
                                            Nombre del Alimento o Platillo <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="nombre"
                                            placeholder="Ej. Chilaquiles con Huevos al Gusto, Comida Corrida Mexicana..."
                                            value={form.data.nombre}
                                            onChange={(e) => form.setData('nombre', e.target.value)}
                                            maxLength={80}
                                            className="font-medium"
                                        />
                                        {form.errors.nombre && <p className="text-xs text-destructive">{form.errors.nombre}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="tipo" className="text-xs font-bold">
                                            Tipo / Clasificación <span className="text-destructive">*</span>
                                        </Label>
                                        <Select
                                            value={form.data.tipo}
                                            onValueChange={(val: any) => {
                                                form.setData('tipo', val);
                                                if (val === 'desayuno') {
                                                    form.setData((prev) => ({ ...prev, tipo: val, icono: 'coffee', color: 'amber', hora_inicio: '06:30', hora_fin: '11:00' }));
                                                } else if (val === 'almuerzo') {
                                                    form.setData((prev) => ({ ...prev, tipo: val, icono: 'utensils', color: 'emerald', hora_inicio: '12:00', hora_fin: '17:00' }));
                                                } else if (val === 'cena') {
                                                    form.setData((prev) => ({ ...prev, tipo: val, icono: 'moon', color: 'blue', hora_inicio: '18:30', hora_fin: '23:30' }));
                                                } else if (val === 'refrigerio') {
                                                    form.setData((prev) => ({ ...prev, tipo: val, icono: 'apple', color: 'purple', hora_inicio: '10:00', hora_fin: '19:00' }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="desayuno">☕ Desayuno (Ej. Chilaquiles, Huevos a la Mexicana)</SelectItem>
                                                <SelectItem value="almuerzo">🍽️ Almuerzo / Comida (Ej. Comida Corrida, Mole, Guisados)</SelectItem>
                                                <SelectItem value="cena">🌙 Cena (Ej. Tacos de Guisado, Sincronizadas)</SelectItem>
                                                <SelectItem value="refrigerio">🍎 Refrigerio / Snack (Ej. Torta de Jamón, Box Lunch)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {form.errors.tipo && <p className="text-xs text-destructive">{form.errors.tipo}</p>}
                                    </div>

                                    {/* PROVEEDOR DE ALIMENTOS */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="proveedor_id" className="text-xs font-bold flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Store className="w-3.5 h-3.5 text-amber-500" /> Proveedor del Menú / Concesionaria
                                            </span>
                                            {proveedoresFiltradosModal.length > 0 && (
                                                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                                    {proveedoresFiltradosModal.length} disponibles
                                                </Badge>
                                            )}
                                        </Label>
                                        <Select
                                            value={form.data.proveedor_id || 'none'}
                                            onValueChange={(val) => form.setData('proveedor_id', val === 'none' ? '' : val)}
                                        >
                                            <SelectTrigger id="proveedor_id" className="h-10">
                                                <SelectValue placeholder="Seleccione un proveedor de alimentos..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">🍽️ Sin proveedor asignado (Preparación propia / Interna)</SelectItem>
                                                {proveedoresFiltradosModal.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        🏪 {p.nombre_comercial} {p.rfc ? `(${p.rfc})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-muted-foreground">
                                            Empresa o concesionaria externa que suministra y factura este alimento.
                                        </p>
                                        {form.errors.proveedor_id && <p className="text-xs text-destructive">{form.errors.proveedor_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="descripcion" className="text-xs font-bold">Descripción / Menú Completo</Label>
                                        <Textarea
                                            id="descripcion"
                                            placeholder="Detalle de platillos, guarnición (arroz, frijoles), tortillas, bebida y postre..."
                                            rows={3}
                                            value={form.data.descripcion}
                                            onChange={(e) => form.setData('descripcion', e.target.value)}
                                            maxLength={255}
                                            className="resize-none text-xs"
                                        />
                                        {form.errors.descripcion && <p className="text-xs text-destructive">{form.errors.descripcion}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> 2. Costos en Pesos Mexicanos (MXN)
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="costo_empleado" className="text-xs font-bold flex items-center justify-between">
                                                <span>Costo al Colaborador</span>
                                                <Badge variant="outline" className="text-[10px] font-mono text-amber-600 dark:text-amber-400">MXN</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-bold">$</span>
                                                <Input
                                                    id="costo_empleado"
                                                    type="number"
                                                    step="0.50"
                                                    min="0"
                                                    value={form.data.costo_empleado}
                                                    onChange={(e) => form.setData('costo_empleado', e.target.value)}
                                                    className="pl-8 font-mono font-bold text-base"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {Number(form.data.costo_empleado) === 0 ? '✓ 100% Subsidiado (Sin costo)' : `Se descuenta $${Number(form.data.costo_empleado).toFixed(2)} MXN`}
                                            </p>
                                            {form.errors.costo_empleado && <p className="text-xs text-destructive">{form.errors.costo_empleado}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="costo_empresa" className="text-xs font-bold flex items-center justify-between">
                                                <span>Costo Proveedor / Empresa</span>
                                                <Badge variant="outline" className="text-[10px] font-mono text-slate-500">MXN</Badge>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-bold">$</span>
                                                <Input
                                                    id="costo_empresa"
                                                    type="number"
                                                    step="0.50"
                                                    min="0"
                                                    value={form.data.costo_empresa}
                                                    onChange={(e) => form.setData('costo_empresa', e.target.value)}
                                                    className="pl-8 font-mono text-base"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Valor factura proveedor de comedor</p>
                                            {form.errors.costo_empresa && <p className="text-xs text-destructive">{form.errors.costo_empresa}</p>}
                                        </div>
                                    </div>
                                </div>

                                {sucursales.length > 0 && (
                                    <div className="space-y-1.5 p-4 rounded-xl border bg-muted/20">
                                        <Label htmlFor="sucursal_id" className="text-xs font-bold flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" /> Sede / Planta Asignada
                                        </Label>
                                        <Select
                                            value={form.data.sucursal_id || 'all'}
                                            onValueChange={(val) => form.setData('sucursal_id', val === 'all' ? '' : val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Global (Disponible en todas las plantas)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Global (Disponible en todas las plantas)</SelectItem>
                                                {sucursales.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        {s.nombre} {sucursal_usuario?.id === s.id ? '★ (Tu Sucursal Autenticada)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {sucursal_usuario && (
                                            <p className="text-[11px] text-muted-foreground">
                                                Predeterminada para tu sede actual: <strong className="text-foreground">{sucursal_usuario.nombre}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* COLUMNA DERECHA (5 columnas): HORARIOS, VISUAL Y PREVIEW */}
                            <div className="lg:col-span-5 space-y-5">
                                {/* HORARIO ESTIPULADO */}
                                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                            <Clock className="w-4 h-4" /> Horario de Servicio del Alimento
                                        </Label>
                                        <Badge variant="outline" className="text-[10px] bg-background border-amber-500/40 text-amber-600 dark:text-amber-400">
                                            Kiosko Inteligente
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        El Kiosko Checador verificará la hora en tiempo real y mostrará este alimento como <strong>Disponible</strong> únicamente dentro de esta franja horaria.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-1">
                                            <Label htmlFor="hora_inicio" className="text-[11px] font-semibold">Hora de Inicio</Label>
                                            <Input
                                                id="hora_inicio"
                                                type="time"
                                                value={form.data.hora_inicio}
                                                onChange={(e) => form.setData('hora_inicio', e.target.value)}
                                                className="bg-background font-mono text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="hora_fin" className="text-[11px] font-semibold">Hora de Fin</Label>
                                            <Input
                                                id="hora_fin"
                                                type="time"
                                                value={form.data.hora_fin}
                                                onChange={(e) => form.setData('hora_fin', e.target.value)}
                                                className="bg-background font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Ícono Táctil</Label>
                                        <Select
                                            value={form.data.icono}
                                            onValueChange={(val) => form.setData('icono', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="coffee">☕ Taza (Desayuno)</SelectItem>
                                                <SelectItem value="utensils">🍴 Cubiertos (Comida)</SelectItem>
                                                <SelectItem value="moon">🌙 Luna (Cena)</SelectItem>
                                                <SelectItem value="apple">🍎 Manzana (Fruta/Snack)</SelectItem>
                                                <SelectItem value="sandwich">🥪 Torta / Sandwich</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold">Orden en Kiosko</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={form.data.orden}
                                            onChange={(e) => form.setData('orden', parseInt(e.target.value) || 1)}
                                            className="font-mono text-center font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold">Alimento Activo</Label>
                                        <p className="text-[11px] text-muted-foreground">Habilitado para colaboradores en el Kiosko</p>
                                    </div>
                                    <Switch
                                        checked={form.data.status}
                                        onCheckedChange={(val) => form.setData('status', val)}
                                    />
                                </div>

                                {/* PREVIEW EN VIVO DEL BOTÓN EN EL KIOSKO */}
                                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                                        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                                            <Eye className="w-3.5 h-3.5" /> Vista Previa en Pantalla del Kiosko
                                        </span>
                                        <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                                            Pantalla Táctil
                                        </Badge>
                                    </div>

                                    <div className="p-5 rounded-xl border-2 border-slate-700 bg-slate-900/90 text-center flex flex-col items-center justify-between gap-3 shadow-lg min-h-[140px]">
                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                            <div className="p-2.5 rounded-full bg-slate-800 text-amber-400">
                                                {renderIconPreview(form.data.icono, 'w-8 h-8 text-amber-400')}
                                            </div>
                                            <span className="font-extrabold text-sm sm:text-base text-white uppercase tracking-tight line-clamp-1">
                                                {form.data.nombre || 'Nombre del Alimento'}
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                                {tipos[form.data.tipo] || form.data.tipo}
                                            </span>
                                            {form.data.proveedor_id && (
                                                <span className="text-[10px] font-semibold tracking-wide text-amber-300/90 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                                    <Store className="w-3 h-3 text-amber-400" />
                                                    {proveedores.find((p) => String(p.id) === String(form.data.proveedor_id))?.nombre_comercial || 'Proveedor Externo'}
                                                </span>
                                            )}
                                        </div>

                                        {form.data.hora_inicio && form.data.hora_fin ? (
                                            <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Servicio: {form.data.hora_inicio} - {form.data.hora_fin}</span>
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">Disponible todo el día</span>
                                        )}

                                        <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-center gap-1.5">
                                            <span className="font-mono text-lg font-black text-amber-300">
                                                {Number(form.data.costo_empleado) > 0
                                                    ? `$${Number(form.data.costo_empleado).toFixed(2)} MXN`
                                                    : 'Sin costo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-4 border-t border-border/60">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="px-5">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 shadow-sm">
                                {editingItem ? 'Guardar Cambios' : 'Crear Alimento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── ALERT DIALOG ELIMINAR ────────────────────────────────────────── */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar opción de comida?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro de que desea eliminar <strong>{deletingItem?.nombre}</strong>? 
                            Esta opción dejará de aparecer inmediatamente en el Kiosko Checador. Los marcajes de asistencia ya registrados en el historial conservarán su registro intacto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-white">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── MODAL DE REPORTE DE LIQUIDACIÓN A PROVEEDORES (EXCEL) ───────────── */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-xl md:max-w-2xl p-6 sm:p-7 rounded-2xl shadow-2xl">
                    <DialogHeader className="pb-3 border-b border-border/60">
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
                            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <span>Reporte de Liquidación a Proveedores de Comedor</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                            Conciliación de raciones de alimentos consumidas para el pago a proveedores de catering, auditoría de descuentos a colaboradores y subsidios de la empresa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 pt-3">
                        {/* Atajos de Fecha */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Período del Corte de Liquidación
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                    onClick={() => handleSetDateRange('quincena')}
                                >
                                    Esta Quincena
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                    onClick={() => handleSetDateRange('mes_actual')}
                                >
                                    Mes Actual
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                    onClick={() => handleSetDateRange('mes_anterior')}
                                >
                                    Mes Anterior
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-8 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                    onClick={() => handleSetDateRange('30dias')}
                                >
                                    Últimos 30 días
                                </Button>
                            </div>
                        </div>

                        {/* Rango de Fechas Desde - Hasta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border bg-muted/20">
                            <div className="space-y-1">
                                <Label htmlFor="report_desde" className="text-xs font-semibold">Fecha Desde (Inicio)</Label>
                                <Input
                                    id="report_desde"
                                    type="date"
                                    value={reportFechaInicio}
                                    onChange={(e) => setReportFechaInicio(e.target.value)}
                                    className="bg-background font-mono text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="report_hasta" className="text-xs font-semibold">Fecha Hasta (Corte)</Label>
                                <Input
                                    id="report_hasta"
                                    type="date"
                                    value={reportFechaFin}
                                    onChange={(e) => setReportFechaFin(e.target.value)}
                                    className="bg-background font-mono text-xs"
                                />
                            </div>
                        </div>

                        {/* Selector de Proveedor */}
                        <div className="space-y-1.5">
                            <Label htmlFor="report_proveedor" className="text-xs font-bold flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Store className="w-3.5 h-3.5 text-amber-500" /> Proveedor de Alimentos
                                </span>
                                {reportProveedorId !== 'all' ? (
                                    <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                                        Proveedor Individual
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30">
                                        Consolidado (Todos los Proveedores)
                                    </Badge>
                                )}
                            </Label>
                            <Select value={reportProveedorId} onValueChange={setReportProveedorId}>
                                <SelectTrigger id="report_proveedor" className="h-10">
                                    <SelectValue placeholder="Seleccione un proveedor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">📊 TODOS LOS PROVEEDORES (Reporte Consolidado)</SelectItem>
                                    {proveedores.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            🏪 {p.nombre_comercial} {p.rfc ? `(${p.rfc})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                {reportProveedorId === 'all'
                                    ? 'Genera la relación completa agrupando y totalizando los alimentos de todos los proveedores.'
                                    : 'Genera el corte exacto y estado de cuenta exclusivo para el proveedor seleccionado.'}
                            </p>
                        </div>

                        {/* Filtros Secundarios: Sede y Clasificación */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Sede / Planta
                                </Label>
                                <Select value={reportSucursalId} onValueChange={setReportSucursalId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las plantas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las plantas (Global)</SelectItem>
                                        {sucursales.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.nombre} {sucursal_usuario?.id === s.id ? '(Tu Sede)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold flex items-center gap-1.5">
                                    <Utensils className="w-3.5 h-3.5 text-slate-400" /> Clasificación / Tiempo
                                </Label>
                                <Select value={reportTipo} onValueChange={setReportTipo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los tiempos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tiempos de comida</SelectItem>
                                        <SelectItem value="desayuno">☕ Desayunos</SelectItem>
                                        <SelectItem value="almuerzo">🍽️ Almuerzos / Comidas</SelectItem>
                                        <SelectItem value="cena">🌙 Cenas</SelectItem>
                                        <SelectItem value="refrigerio">🍎 Refrigerios</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Caja Informativa de lo que contiene el archivo Excel */}
                        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted-foreground space-y-1.5">
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4" /> El archivo Excel (.xlsx) contendrá 2 hojas ejecutivas:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                                <li><strong>Hoja 1: Resumen y Liquidación</strong> (Carátula con KPIs de facturación, total de raciones, descuento nómina, subsidio empresa y tabla por proveedor/tiempo).</li>
                                <li><strong>Hoja 2: Detalle de Consumos</strong> (Relación completa de cada alimento consumido con fecha, hora, no. nómina, colaborador, departamento, puesto, platillo, costo factura y fórmulas).</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-4 border-t border-border/60">
                        <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDownloadExcel}
                            disabled={isDownloading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
                        >
                            {isDownloading ? (
                                <span>Generando Excel...</span>
                            ) : (
                                <>
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Exportar a Excel (.xlsx)</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
