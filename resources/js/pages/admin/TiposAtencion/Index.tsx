import React, { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin/admin-saas-layout';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/utils/notifications';

// UI Components
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { DataTable, type ColumnDef } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icons
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileText,
    HeartPulse,
    Home,
    MoreVertical,
    Pencil,
    Plus,
    Repeat,
    Sparkles,
    Stethoscope,
    Trash2,
    UserPlus,
    Video,
} from 'lucide-react';

// Interfaces
export interface TipoAtencion {
    id: number;
    empresa_id: number | null;
    nombre: string;
    slug: string;
    codigo: string;
    modalidad: string;
    tipo_consulta: string;
    es_primera_vez: boolean;
    es_subsecuente: boolean;
    descripcion: string | null;
    icono: string;
    color: string;
    duracion_estimada_minutos: number;
    requiere_link_virtual: boolean;
    requiere_direccion: boolean;
    costo_adicional_sugerido: number | null;
    permite_reserva_online: boolean;
    status: boolean;
    created_at?: string;
    updated_at?: string;
}

interface StatsProps {
    total: number;
    activos: number;
    primera_vez: number;
    subsecuentes: number;
    virtuales: number;
    domiciliarios: number;
}

interface TiposAtencionPageProps {
    tiposAtencion: any;
    stats: StatsProps;
    filters: {
        search?: string;
        modalidad?: string;
        tipo_consulta?: string;
        status?: string;
        perPage?: string;
    };
}

const AVAILABLE_ICONS = [
    { name: 'Stethoscope', icon: Stethoscope, label: 'Estetoscopio' },
    { name: 'UserPlus', icon: UserPlus, label: 'Primera Vez' },
    { name: 'Repeat', icon: Repeat, label: 'Subsecuente / Control' },
    { name: 'Video', icon: Video, label: 'Telemedicina' },
    { name: 'Home', icon: Home, label: 'Atención Domicilio' },
    { name: 'AlertTriangle', icon: AlertTriangle, label: 'Urgencia' },
    { name: 'Activity', icon: Activity, label: 'Actividad Clínica' },
    { name: 'HeartPulse', icon: HeartPulse, label: 'Monitoreo / Salud' },
    { name: 'FileText', icon: FileText, label: 'Procedimiento / Examen' },
    { name: 'Clock', icon: Clock, label: 'Control Horario' },
];

export default function TiposAtencionIndex({
    tiposAtencion,
    stats,
    filters,
}: TiposAtencionPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Care Types'), href: '/admin/tipos-atencion' },
    ];

    // ── Estados ──────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [editingTipo, setEditingTipo]           = useState<TipoAtencion | null>(null);
    const [isTableLoading, setIsTableLoading]     = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]             = useState(filters.search || '');
    const [modalidadFilter, setModalidadFilter]   = useState(filters.modalidad || '');
    const [tipoConsultaFilter, setTipoConsultaFilter] = useState(filters.tipo_consulta || '');
    const [statusFilter, setStatusFilter]         = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter]       = useState(filters.perPage || '10');

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        codigo: '',
        modalidad: 'presencial',
        tipo_consulta: 'general',
        es_primera_vez: false,
        es_subsecuente: false,
        descripcion: '',
        icono: 'Stethoscope',
        color: '#3b82f6',
        duracion_estimada_minutos: 30,
        requiere_link_virtual: false,
        requiere_direccion: false,
        costo_adicional_sugerido: '' as string | number,
        permite_reserva_online: true,
        status: true,
    });

    // ── Navigation & Debounce ──────────────────────────────────────────────────
    useEffect(() => {
        const unbindStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get') {
                setIsTableLoading(true);
            }
        });
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    modalidad: modalidadFilter,
                    tipo_consulta: tipoConsultaFilter,
                    status: statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, modalidadFilter, tipoConsultaFilter, statusFilter, perPageFilter]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCreateClick = () => {
        setEditingTipo(null);
        reset();
        setData({
            nombre: '',
            codigo: '',
            modalidad: 'presencial',
            tipo_consulta: 'general',
            es_primera_vez: false,
            es_subsecuente: false,
            descripcion: '',
            icono: 'Stethoscope',
            color: '#3b82f6',
            duracion_estimada_minutos: 30,
            requiere_link_virtual: false,
            requiere_direccion: false,
            costo_adicional_sugerido: '',
            permite_reserva_online: true,
            status: true,
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (tipo: TipoAtencion) => {
        setEditingTipo(tipo);
        setData({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            modalidad: tipo.modalidad,
            tipo_consulta: tipo.tipo_consulta,
            es_primera_vez: tipo.es_primera_vez,
            es_subsecuente: tipo.es_subsecuente,
            descripcion: tipo.descripcion || '',
            icono: tipo.icono || 'Stethoscope',
            color: tipo.color || '#3b82f6',
            duracion_estimada_minutos: tipo.duracion_estimada_minutos || 30,
            requiere_link_virtual: tipo.requiere_link_virtual,
            requiere_direccion: tipo.requiere_direccion,
            costo_adicional_sugerido: tipo.costo_adicional_sugerido !== null ? tipo.costo_adicional_sugerido : '',
            permite_reserva_online: tipo.permite_reserva_online,
            status: tipo.status,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTipo) {
            put(`/admin/tipos-atencion/${editingTipo.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/tipos-atencion', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (tipo: TipoAtencion) => {
        router.patch(`/admin/tipos-atencion/${tipo.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (tipo: TipoAtencion) => {
        if (confirm(__('Are you sure you want to delete this care type?'))) {
            router.delete(`/admin/tipos-atencion/${tipo.id}`, {
                preserveScroll: true,
            });
        }
    };


    // Helper render icon
    const renderLucideIcon = (iconName: string, className = 'w-4 h-4') => {
        const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
        const IconComponent = found ? found.icon : Stethoscope;
        return <IconComponent className={className} />;
    };

    // ── Columnas de la Tabla ──────────────────────────────────────────────────
    const columns: ColumnDef<TipoAtencion>[] = [
        {
            header: __('Care Type & Modalidad'),
            cell: (tipo) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: tipo.color || '#3b82f6' }}
                    >
                        {renderLucideIcon(tipo.icono, 'w-5 h-5')}
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                                {tipo.nombre}
                            </span>
                            {tipo.codigo && (
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                    {tipo.codigo}
                                </Badge>
                            )}
                        </div>
                        {tipo.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                                {tipo.descripcion}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Classification'),
            cell: (tipo) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="capitalize text-xs font-semibold">
                            {tipo.modalidad}
                        </Badge>
                        {tipo.es_primera_vez && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-400 text-[10px]">
                                {__('Primera Vez')}
                            </Badge>
                        )}
                        {tipo.es_subsecuente && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px]">
                                {__('Subsecuente / Control')}
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Requirements & Duration'),
            cell: (tipo) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{tipo.duracion_estimada_minutos} min</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {tipo.requiere_link_virtual && (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400">
                                🖥️ Link Virtual
                            </Badge>
                        )}
                        {tipo.requiere_direccion && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">
                                📍 Dirección
                            </Badge>
                        )}
                        {tipo.permite_reserva_online && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400">
                                🌐 Portal Online
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (tipo) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={tipo.status}
                        onCheckedChange={() => handleToggleStatus(tipo)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            tipo.status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {tipo.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (tipo) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(tipo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(tipo)}>
                            <Activity className="mr-2 h-4 w-4" />
                            {tipo.status ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(tipo)}
                            className="text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title={__('Care Types')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ── Encabezado del Módulo ────────────────────────────────────── */}
                <ModuleHeader
                    icon={<Activity className="h-6 w-6 text-white" />}
                    title={__('Care & Consultation Types')}
                    description={__('Configure care modalities (In-Person, Telemedicine, Home Care) and consultation criteria (First Time vs. Follow-up/Control) for appointments.')}
                    colorClassName="bg-blue-600"
                >
                    <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Care Type')}
                    </Button>
                </ModuleHeader>

                {/* ── Tarjetas Estadísticas ─────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <StatCard
                        icon={<Activity className="h-6 w-6" />}
                        title={__('TOTAL CARE TYPES')}
                        value={stats.total}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE TYPES')}
                        value={stats.activos}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<UserPlus className="h-6 w-6" />}
                        title={__('FIRST-TIME PATIENT')}
                        value={stats.primera_vez}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<Video className="h-6 w-6" />}
                        title={__('VIRTUAL & HOME CARE')}
                        value={stats.virtuales + stats.domiciliarios}
                        colorClassName="bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                    />
                </div>

                {/* ── Filtros y Barra de Búsqueda ───────────────────────────── */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search care type name, code or details...')}
                                className="w-full md:w-72"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Modalidad')}>
                            <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue placeholder={__('All Modalities')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All Modalities')}</SelectItem>
                                    <SelectItem value="presencial">{__('Presencial')}</SelectItem>
                                    <SelectItem value="telemedicina">{__('Telemedicina / Virtual')}</SelectItem>
                                    <SelectItem value="domicilio">{__('Atención Domiciliaria')}</SelectItem>
                                    <SelectItem value="urgencia">{__('Urgencia / Emergencia')}</SelectItem>
                                    <SelectItem value="procedimiento">{__('Procedimiento Médico')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label={__('Records per page')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* ── Tabla de Datos ───────────────────────────────────────── */}
                <div className="w-full">
                    <DataTable
                        data={tiposAtencion}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(tipo) => handleEditClick(tipo)}
                    />
                </div>

                {/* ── Modal de Creación / Edición ──────────────────────────── */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl shadow-2xl">
                        <DialogHeader className="border-b border-border/60 pb-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-2xl shrink-0 shadow-xs">
                                    <Sparkles className="w-7 h-7" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-extrabold tracking-tight text-foreground">
                                        {editingTipo ? __('Edit Care Type') : __('New Care Type')}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                                        {__('Configure consultation attributes, virtual/home requirements, and calendar aesthetics.')}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Columna Izquierda (6 cols) */}
                                <div className="lg:col-span-6 space-y-6">
                                    {/* Bloque 1: Información Principal */}
                                    <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                                            {__('Información Principal')}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="nombre" className="text-xs font-bold">{__('Care Type Name')} *</Label>
                                                <Input
                                                    id="nombre"
                                                    value={data.nombre}
                                                    onChange={(e) => setData('nombre', e.target.value)}
                                                    placeholder="Ej: Consulta Presencial Primera Vez"
                                                    className="mt-1.5 h-11 text-sm font-medium"
                                                />
                                                {errors.nombre && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.nombre}</p>}
                                            </div>

                                            <div>
                                                <Label htmlFor="codigo" className="text-xs font-bold">{__('Identification Code (Optional)')}</Label>
                                                <Input
                                                    id="codigo"
                                                    value={data.codigo}
                                                    onChange={(e) => setData('codigo', e.target.value)}
                                                    placeholder="Ej: PRESENCIAL_PRIMERA"
                                                    className="font-mono uppercase mt-1.5 h-11 text-sm tracking-wider"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="modalidad" className="text-xs font-bold">{__('Care Modality')} *</Label>
                                                    <Select
                                                        value={data.modalidad}
                                                        onValueChange={(val) => setData('modalidad', val)}
                                                    >
                                                        <SelectTrigger id="modalidad" className="w-full mt-1.5 h-11">
                                                            <SelectValue placeholder={__('Select Modality')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="presencial">{__('Presencial (En Clínica)')}</SelectItem>
                                                            <SelectItem value="telemedicina">{__('Telemedicina / Virtual')}</SelectItem>
                                                            <SelectItem value="domicilio">{__('Atención Domiciliaria')}</SelectItem>
                                                            <SelectItem value="urgencia">{__('Urgencia / Prioritaria')}</SelectItem>
                                                            <SelectItem value="procedimiento">{__('Procedimiento / Examen')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="tipo_consulta" className="text-xs font-bold">{__('Consultation Criterion')}</Label>
                                                    <Select
                                                        value={data.tipo_consulta}
                                                        onValueChange={(val) => setData('tipo_consulta', val)}
                                                    >
                                                        <SelectTrigger id="tipo_consulta" className="w-full mt-1.5 h-11">
                                                            <SelectValue placeholder={__('Select Criterion')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="primera_vez">{__('Primera Vez')}</SelectItem>
                                                            <SelectItem value="subsecuente">{__('Subsecuente / Control')}</SelectItem>
                                                            <SelectItem value="general">{__('General / Estándar')}</SelectItem>
                                                            <SelectItem value="procedimiento">{__('Procedimiento Clínico')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bloque 2: Banderas de Criterio de Atención */}
                                    <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/60 space-y-3.5 shadow-xs">
                                        <h3 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                            {__('Criterios de Atención Paciente')}
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950 shadow-xs">
                                                <Label htmlFor="es_primera_vez" className="text-xs font-bold cursor-pointer text-foreground">
                                                    {__('¿Es Consulta de Primera Vez?')}
                                                </Label>
                                                <Switch
                                                    id="es_primera_vez"
                                                    checked={data.es_primera_vez}
                                                    onCheckedChange={(c) => setData('es_primera_vez', c)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-950 shadow-xs">
                                                <Label htmlFor="es_subsecuente" className="text-xs font-bold cursor-pointer text-foreground">
                                                    {__('¿Es Consulta Subsecuente / Control?')}
                                                </Label>
                                                <Switch
                                                    id="es_subsecuente"
                                                    checked={data.es_subsecuente}
                                                    onCheckedChange={(c) => setData('es_subsecuente', c)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna Derecha (6 cols) */}
                                <div className="lg:col-span-6 space-y-6">
                                    {/* Bloque 3: Requisitos y portal online */}
                                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 dark:bg-slate-900/30 dark:border-slate-800 space-y-3.5 shadow-xs">
                                        <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            {__('Requisitos de Agendamiento')}
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                                                <Label htmlFor="requiere_link_virtual" className="text-xs font-bold cursor-pointer text-foreground">
                                                    {__('Requiere Link Virtual')}
                                                </Label>
                                                <Switch
                                                    id="requiere_link_virtual"
                                                    checked={data.requiere_link_virtual}
                                                    onCheckedChange={(c) => setData('requiere_link_virtual', c)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                                                <Label htmlFor="requiere_direccion" className="text-xs font-bold cursor-pointer text-foreground">
                                                    {__('Requiere Dirección')}
                                                </Label>
                                                <Switch
                                                    id="requiere_direccion"
                                                    checked={data.requiere_direccion}
                                                    onCheckedChange={(c) => setData('requiere_direccion', c)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                                                <Label htmlFor="permite_reserva_online" className="text-xs font-bold cursor-pointer text-foreground">
                                                    {__('Reserva Portal Online')}
                                                </Label>
                                                <Switch
                                                    id="permite_reserva_online"
                                                    checked={data.permite_reserva_online}
                                                    onCheckedChange={(c) => setData('permite_reserva_online', c)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bloque 4: Duración & Costos */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="duracion_estimada_minutos" className="text-xs font-bold">{__('Duración Estimada (Minutos)')} *</Label>
                                            <Input
                                                id="duracion_estimada_minutos"
                                                type="number"
                                                min="5"
                                                max="480"
                                                value={data.duracion_estimada_minutos}
                                                onChange={(e) => setData('duracion_estimada_minutos', parseInt(e.target.value) || 30)}
                                                className="mt-1.5 h-11 font-mono text-sm font-semibold"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="costo_adicional_sugerido" className="text-xs font-bold">{__('Costo Adicional Sugerido (Opcional)')}</Label>
                                            <Input
                                                id="costo_adicional_sugerido"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.costo_adicional_sugerido}
                                                onChange={(e) => setData('costo_adicional_sugerido', e.target.value)}
                                                placeholder="0.00"
                                                className="mt-1.5 h-11 font-mono text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* Bloque 5: Selector de Iconos y Color */}
                                    <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
                                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                            <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{__('Icono Representativo & Color Visual')}</Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase">{__('Color')}:</span>
                                                <input
                                                    type="color"
                                                    id="color"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    className="w-7 h-7 rounded-lg border border-border cursor-pointer p-0.5"
                                                />
                                                <span className="font-mono text-xs font-bold">{data.color}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2.5 pt-1">
                                            {AVAILABLE_ICONS.map((item) => {
                                                const IconComp = item.icon;
                                                const isSelected = data.icono === item.name;
                                                return (
                                                    <button
                                                        key={item.name}
                                                        type="button"
                                                        onClick={() => setData('icono', item.name)}
                                                        className={cn(
                                                            'flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs gap-1.5',
                                                            isSelected
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-bold ring-2 ring-blue-500/20 shadow-xs'
                                                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-muted-foreground'
                                                        )}
                                                        title={item.label}
                                                    >
                                                        <IconComp className="w-5 h-5" />
                                                        <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bloque 6: Descripción & Estado */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <Label htmlFor="descripcion" className="text-xs font-bold">{__('Descripción o Notas (Opcional)')}</Label>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="status"
                                                    checked={data.status}
                                                    onCheckedChange={(checked) => setData('status', checked)}
                                                />
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {data.status ? __('Active') : __('Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                        <Textarea
                                            id="descripcion"
                                            value={data.descripcion}
                                            onChange={(e) => setData('descripcion', e.target.value)}
                                            placeholder="Detalles explicativos sobre esta modalidad de consulta..."
                                            rows={2}
                                            className="mt-1 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="border-t border-border/60 pt-5 flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 h-11 font-semibold text-sm"
                                >
                                    {__('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 font-bold text-sm shadow-md"
                                >
                                    {editingTipo ? __('Save Changes') : __('Create Care Type')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>


            </div>
        </>
    );
}
