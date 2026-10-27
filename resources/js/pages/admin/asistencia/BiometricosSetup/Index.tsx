import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Cpu,
    FileSpreadsheet,
    MapPin,
    MoreVertical,
    Network,
    Pencil,
    Plus,
    Server,
    Sparkles,
    ToggleRight,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/use-permission';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifyError } from '@/utils/notifications';
import EquiposUbicacionesImportModal from '../Partials/EquiposUbicacionesImportModal';

interface UbicacionOption {
    id: number;
    numero_localidad: number | null;
    planta: string;
    estado: string | null;
    ciudad: string | null;
    legacy: string | null;
    direccion: string | null;
}

interface RelojEquipoBiometrico {
    id: number;
    empresa_id: number | null;
    reloj_ubicacion_id: number | null;
    legacy: string | null;
    localidad_nombre: string;
    numero_localidad: number | null;
    ubicacion_fisica: string | null;
    actual_no_serie: string | null;
    actual_ip: string | null;
    actual_mascara: string | null;
    actual_gateway: string | null;
    actual_instalado: boolean;
    actual_comentario: string | null;
    nuevo_marca: string | null;
    nuevo_modelo: string | null;
    nuevo_no_serie: string | null;
    nuevo_ip: string | null;
    nuevo_mascara: string | null;
    nuevo_gateway: string | null;
    nuevo_instalado: boolean;
    nuevo_comentario: string | null;
    nuevo_mac_address: string | null;
    activo: boolean;
    ubicacion?: UbicacionOption | null;
}

interface BiometricosSetupPageProps {
    biometricos: Paginated<RelojEquipoBiometrico>;
    stats: {
        total: number;
        actual_instalados: number;
        actual_no_instalados: number;
        nuevo_instalados: number;
        pendientes_ubicacion: number;
        por_legacy: Record<string, number>;
    };
    ubicacionesCatalogo: UbicacionOption[];
    legaciesDisponibles: string[];
    empresas: { id: number; razon_social: string }[];
    filters: {
        search?: string;
        legacy?: string;
        reloj_ubicacion_id?: string;
        numero_localidad?: string;
        actual_instalado?: string;
        nuevo_instalado?: string;
        status?: string;
        perPage?: string;
    };
}

const initialForm = {
    empresa_id: '' as string | number,
    reloj_ubicacion_id: '' as string | number,
    legacy: '',
    localidad_nombre: '',
    numero_localidad: '' as string | number,
    ubicacion_fisica: '',
    actual_no_serie: '',
    actual_ip: '',
    actual_mascara: '',
    actual_gateway: '',
    actual_instalado: true,
    actual_comentario: '',
    nuevo_marca: '',
    nuevo_modelo: '',
    nuevo_no_serie: '',
    nuevo_ip: '',
    nuevo_mascara: '',
    nuevo_gateway: '',
    nuevo_instalado: false,
    nuevo_comentario: '',
    nuevo_mac_address: '',
    activo: true,
};

function getLegacyBadgeStyle(legacy?: string | null) {
    const val = (legacy || '').toUpperCase();
    if (val.includes('FSK NA')) {
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800';
    }
    if (val.includes('FSK MX') || val.includes('FSKM')) {
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800';
    }
    if (val.includes('FWR GG') || val.includes('FWRGG')) {
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
    }
    if (val.includes('BIB')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

export default function BiometricosSetupIndexPage({
    biometricos,
    stats,
    ubicacionesCatalogo,
    legaciesDisponibles,
    empresas,
    filters,
}: BiometricosSetupPageProps) {
    const { can } = usePermission();
    const canManage = can('asistencia.configuracion');

    const breadcrumbs = [
        { title: 'Panel de control', href: '/dashboard' },
        { title: 'Reloj Checador', href: '/admin/asistencia/biometricos-setup' },
        { title: 'Biométricos Setup', href: '/admin/asistencia/biometricos-setup' },
    ];

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [legacyFilter, setLegacyFilter] = useState(filters.legacy || 'all');
    const [ubicacionFilter, setUbicacionFilter] = useState(filters.reloj_ubicacion_id || 'all');
    const [numLocalidadFilter, setNumLocalidadFilter] = useState(filters.numero_localidad || '');
    const [actualInstaladoFilter, setActualInstaladoFilter] = useState(filters.actual_instalado || 'all');
    const [nuevoInstaladoFilter, setNuevoInstaladoFilter] = useState(filters.nuevo_instalado || 'all');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '15');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RelojEquipoBiometrico | null>(null);
    const [deletingItem, setDeletingItem] = useState<RelojEquipoBiometrico | null>(null);

    const { data, setData, reset, errors, processing } = useForm(initialForm);

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/asistencia/biometricos-setup',
                cleanParams({
                    search: searchTerm,
                    legacy: legacyFilter === 'all' ? '' : legacyFilter,
                    reloj_ubicacion_id: ubicacionFilter === 'all' ? '' : ubicacionFilter,
                    numero_localidad: numLocalidadFilter,
                    actual_instalado: actualInstaladoFilter === 'all' ? '' : actualInstaladoFilter,
                    nuevo_instalado: nuevoInstaladoFilter === 'all' ? '' : nuevoInstaladoFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, legacyFilter, ubicacionFilter, numLocalidadFilter, actualInstaladoFilter, nuevoInstaladoFilter, perPageFilter]);

    const handleCreateClick = () => {
        setEditingItem(null);
        reset();
        setData({
            ...initialForm,
            empresa_id: empresas.length === 1 ? empresas[0].id : '',
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: RelojEquipoBiometrico) => {
        setEditingItem(item);
        setData({
            empresa_id: item.empresa_id ?? (empresas[0]?.id || ''),
            reloj_ubicacion_id: item.reloj_ubicacion_id ?? '',
            legacy: item.legacy || '',
            localidad_nombre: item.localidad_nombre || '',
            numero_localidad: item.numero_localidad ?? '',
            ubicacion_fisica: item.ubicacion_fisica || '',
            actual_no_serie: item.actual_no_serie || '',
            actual_ip: item.actual_ip || '',
            actual_mascara: item.actual_mascara || '',
            actual_gateway: item.actual_gateway || '',
            actual_instalado: Boolean(item.actual_instalado),
            actual_comentario: item.actual_comentario || '',
            nuevo_marca: item.nuevo_marca || '',
            nuevo_modelo: item.nuevo_modelo || '',
            nuevo_no_serie: item.nuevo_no_serie || '',
            nuevo_ip: item.nuevo_ip || '',
            nuevo_mascara: item.nuevo_mascara || '',
            nuevo_gateway: item.nuevo_gateway || '',
            nuevo_instalado: Boolean(item.nuevo_instalado),
            nuevo_comentario: item.nuevo_comentario || '',
            nuevo_mac_address: item.nuevo_mac_address || '',
            activo: Boolean(item.activo),
        });
        setIsModalOpen(true);
    };

    const handleSelectUbicacionCatalogo = (val: string) => {
        if (val === 'none') {
            setData('reloj_ubicacion_id', '');
            return;
        }
        const ubId = Number(val);
        const found = ubicacionesCatalogo.find((u) => u.id === ubId);
        if (found) {
            setData({
                ...data,
                reloj_ubicacion_id: found.id,
                localidad_nombre: data.localidad_nombre || found.planta,
                numero_localidad: found.numero_localidad ?? data.numero_localidad,
                legacy: found.legacy || data.legacy,
            });
        } else {
            setData('reloj_ubicacion_id', ubId);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            reloj_ubicacion_id: data.reloj_ubicacion_id === '' ? null : Number(data.reloj_ubicacion_id),
            numero_localidad: data.numero_localidad === '' ? null : Number(data.numero_localidad),
        };

        if (editingItem) {
            router.put(`/admin/asistencia/biometricos-setup/${editingItem.id}`, payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    reset();
                },
                onError: () => notifyError('Por favor revisa los campos del formulario.'),
            });
        } else {
            router.post('/admin/asistencia/biometricos-setup', payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                onError: () => notifyError('Por favor revisa los campos del formulario.'),
            });
        }
    };

    const handleToggleStatus = (item: RelojEquipoBiometrico) => {
        router.patch(`/admin/asistencia/biometricos-setup/${item.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingItem) return;
        router.delete(`/admin/asistencia/biometricos-setup/${deletingItem.id}`, {
            onSuccess: () => setDeletingItem(null),
        });
    };

    const columns: ColumnDef<RelojEquipoBiometrico>[] = [
        {
            header: 'Localidad & Ubicación',
            cell: (item) => {
                const isPendingUbi = !item.ubicacion_fisica || item.ubicacion_fisica === '???';
                return (
                    <div className="space-y-1.5 min-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                            {item.numero_localidad !== null && (
                                <span className="inline-flex h-6 px-2 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                                    #{item.numero_localidad}
                                </span>
                            )}
                            {item.legacy && (
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                        getLegacyBadgeStyle(item.legacy)
                                    )}
                                >
                                    {item.legacy}
                                </span>
                            )}
                            <span className="font-semibold text-sm text-foreground">{item.localidad_nombre}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isPendingUbi ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    Ubicación por definir (???)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-foreground">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    {item.ubicacion_fisica}
                                </span>
                            )}
                        </div>

                        {item.ubicacion && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[290px]" title={item.ubicacion.direccion || ''}>
                                {[item.ubicacion.ciudad, item.ubicacion.estado].filter(Boolean).join(', ')}
                                {item.ubicacion.direccion ? ` — ${item.ubicacion.direccion}` : ''}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Equipo Actual',
            cell: (item) => {
                const hasActualData = item.actual_no_serie || item.actual_ip || item.actual_gateway || item.actual_comentario;
                return (
                    <div className="rounded-xl border bg-slate-50/60 dark:bg-slate-900/40 p-2.5 space-y-1 min-w-[230px]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                Actual
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px]',
                                    item.actual_instalado
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                        : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                )}
                            >
                                {item.actual_instalado ? 'Instalado: Yes' : 'Instalado: No'}
                            </Badge>
                        </div>

                        {hasActualData ? (
                            <div className="space-y-0.5 text-xs">
                                <p className="font-mono text-[11px]">
                                    <span className="text-muted-foreground">S/N:</span>{' '}
                                    <strong className="text-foreground">{item.actual_no_serie || 'S/N'}</strong>
                                </p>
                                {item.actual_ip && (
                                    <p className="font-mono text-[11px] flex items-center gap-1">
                                        <Network className="h-3 w-3 text-indigo-500" />
                                        <span>{item.actual_ip}</span>
                                        {item.actual_mascara && (
                                            <span className="text-muted-foreground text-[10px]">({item.actual_mascara})</span>
                                        )}
                                    </p>
                                )}
                                {item.actual_gateway && (
                                    <p className="font-mono text-[10px] text-muted-foreground">GW: {item.actual_gateway}</p>
                                )}
                                {item.actual_comentario && item.actual_comentario !== 'S/N' && (
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 italic pt-0.5">
                                        “{item.actual_comentario}”
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic py-1">Sin datos de equipo actual</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Nuevo Biométrico',
            cell: (item) => {
                const hasNuevoData =
                    item.nuevo_marca ||
                    item.nuevo_modelo ||
                    item.nuevo_no_serie ||
                    item.nuevo_ip ||
                    item.nuevo_mac_address ||
                    item.nuevo_gateway ||
                    item.nuevo_comentario;
                return (
                    <div
                        className={cn(
                            'rounded-xl border p-2.5 space-y-1 min-w-[230px]',
                            hasNuevoData || item.nuevo_instalado
                                ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                : 'border-dashed border-slate-200 dark:border-slate-800 bg-transparent'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Nuevo
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[10px]',
                                    item.nuevo_instalado
                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                )}
                            >
                                {item.nuevo_instalado ? 'Instalado: Yes' : 'Pendiente'}
                            </Badge>
                        </div>

                        {hasNuevoData ? (
                            <div className="space-y-0.5 text-xs">
                                {(item.nuevo_marca || item.nuevo_modelo) && (
                                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                        {[item.nuevo_marca, item.nuevo_modelo].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                                <p className="font-mono text-[11px]">
                                    <span className="text-muted-foreground">S/N:</span>{' '}
                                    <strong className="text-foreground">{item.nuevo_no_serie || '—'}</strong>
                                </p>
                                {item.nuevo_ip && (
                                    <p className="font-mono text-[11px] flex items-center gap-1">
                                        <Network className="h-3 w-3 text-emerald-600" />
                                        <span>{item.nuevo_ip}</span>
                                        {item.nuevo_mascara && (
                                            <span className="text-muted-foreground text-[10px]">({item.nuevo_mascara})</span>
                                        )}
                                    </p>
                                )}
                                {item.nuevo_mac_address && (
                                    <p className="font-mono text-[10px] text-muted-foreground">MAC: {item.nuevo_mac_address}</p>
                                )}
                                {item.nuevo_gateway && (
                                    <p className="font-mono text-[10px] text-muted-foreground">GW: {item.nuevo_gateway}</p>
                                )}
                                {item.nuevo_comentario && (
                                    <p className="text-[11px] text-muted-foreground italic pt-0.5">“{item.nuevo_comentario}”</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic py-1">Por asignar nuevo biométrico</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Estatus',
            stopRowClick: true,
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <Switch
                        disabled={!canManage}
                        checked={Boolean(item.activo)}
                        onCheckedChange={() => canManage && handleToggleStatus(item)}
                    />
                </div>
            ),
        },
        {
            header: 'Acciones',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (item) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {item.numero_localidad && (
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/asistencia/ubicaciones?search=${item.numero_localidad}`}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Ver Ubicación #{item.numero_localidad}
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <>
                                <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar Biométrico Setup
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {item.activo ? 'Desactivar' : 'Activar'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeletingItem(item)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title="Biométricos Setup - Reloj Checador" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Cpu className="h-6 w-6 text-white" />}
                    title="Biométricos Setup (Inventario Actual y Nuevos Equipos)"
                    description="Gestiona la configuración de red, números de serie, direcciones IP/MAC y transición de Equipos Actuales a Nuevos Biométricos por localidad."
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                            <Link href="/admin/asistencia/ubicaciones">
                                <MapPin className="mr-2 h-4 w-4" />
                                Catálogo de Ubicaciones
                            </Link>
                        </Button>
                        {canManage && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="gap-2"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    Importar Excel Maestro
                                </Button>
                                <Button onClick={handleCreateClick}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Biométrico
                                </Button>
                            </>
                        )}
                    </div>
                </ModuleHeader>

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Cpu className="h-6 w-6" />}
                        title="TOTAL EQUIPOS / POSICIONES"
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<Server className="h-6 w-6" />}
                        title="EQUIPOS ACTUALES INSTALADOS"
                        value={stats.actual_instalados}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        title="NUEVOS BIOMÉTRICOS INSTALADOS"
                        value={stats.nuevo_instalados}
                        colorClassName="bg-sky-100 text-sky-600"
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-6 w-6" />}
                        title="UBICACIÓN POR DEFINIR (???)"
                        value={stats.pendientes_ubicacion}
                        colorClassName="bg-amber-100 text-amber-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-3">
                        <FilterField label="Buscar">
                            <Input
                                placeholder="Buscar por localidad, IP, serie, MAC, ubicación..."
                                className="w-full md:w-72"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label="Legacy">
                            <Select value={legacyFilter} onValueChange={setLegacyFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Legacy</SelectItem>
                                    {legaciesDisponibles.map((leg) => (
                                        <SelectItem key={leg} value={leg}>
                                            {leg}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Planta / Ubicación">
                            <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue placeholder="Todas las plantas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las plantas</SelectItem>
                                    {ubicacionesCatalogo.map((ub) => (
                                        <SelectItem key={ub.id} value={String(ub.id)}>
                                            {ub.numero_localidad ? `#${ub.numero_localidad} - ` : ''}
                                            {ub.planta}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Actual Instalado">
                            <Select value={actualInstaladoFilter} onValueChange={setActualInstaladoFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Sí (Instalado)</SelectItem>
                                    <SelectItem value="0">No instalado</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Nuevo Instalado">
                            <Select value={nuevoInstaladoFilter} onValueChange={setNuevoInstaladoFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Sí (Instalado)</SelectItem>
                                    <SelectItem value="0">Pendiente</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        {(numLocalidadFilter || ubicacionFilter !== 'all' || legacyFilter !== 'all' || searchTerm) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setLegacyFilter('all');
                                    setUbicacionFilter('all');
                                    setNumLocalidadFilter('');
                                    setActualInstaladoFilter('all');
                                    setNuevoInstaladoFilter('all');
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                </FilterBar>

                {/* Tabla */}
                <DataTable
                    data={biometricos}
                    columns={columns}
                    filters={filters}
                    onRowClick={(item) => canManage && handleEditClick(item)}
                />
            </div>

            {/* Modal Crear / Editar Biométrico Setup */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[95vw] lg:max-w-[1040px] max-h-[92vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'Editar Biométrico Setup' : 'Registrar Biométrico Setup'}
                        </DialogTitle>
                        <DialogDescription>
                            Configura la localidad, los datos del Equipo Actual y los datos del Nuevo Biométrico.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        {/* Sección 1: Localidad y Ubicación */}
                        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                1. Localidad y Ubicación Física
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6 space-y-2">
                                    <Label>Vincular con Catálogo de Ubicaciones</Label>
                                    <Select
                                        value={data.reloj_ubicacion_id ? String(data.reloj_ubicacion_id) : 'none'}
                                        onValueChange={handleSelectUbicacionCatalogo}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar planta del catálogo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin vincular / Manual</SelectItem>
                                            {ubicacionesCatalogo.map((ub) => (
                                                <SelectItem key={ub.id} value={String(ub.id)}>
                                                    {ub.numero_localidad ? `[#${ub.numero_localidad}] ` : ''}
                                                    {ub.planta} {ub.legacy ? `(${ub.legacy})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="numero_localidad">Núm. Localidad</Label>
                                    <Input
                                        id="numero_localidad"
                                        type="number"
                                        placeholder="Ej. 26"
                                        value={data.numero_localidad}
                                        onChange={(e) => setData('numero_localidad', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="legacy">Legacy</Label>
                                    <Select
                                        value={data.legacy || 'none'}
                                        onValueChange={(val) => setData('legacy', val === 'none' ? '' : val)}
                                    >
                                        <SelectTrigger id="legacy">
                                            <SelectValue placeholder="Seleccionar Legacy..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin Legacy</SelectItem>
                                            <SelectItem value="fSK NA">fSK NA</SelectItem>
                                            <SelectItem value="fSK NA (PS)">fSK NA (PS)</SelectItem>
                                            <SelectItem value="fSK MX">fSK MX</SelectItem>
                                            <SelectItem value="fWR GG">fWR GG</SelectItem>
                                            <SelectItem value="BIB">BIB</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="localidad_nombre">Nombre de Localidad *</Label>
                                    <Input
                                        id="localidad_nombre"
                                        placeholder="Ej. CONSUMER PACKAGING TIJUANA (LSKNA)"
                                        value={data.localidad_nombre}
                                        onChange={(e) => setData('localidad_nombre', e.target.value)}
                                        required
                                    />
                                    {errors.localidad_nombre && (
                                        <p className="text-xs text-red-500">{errors.localidad_nombre}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="ubicacion_fisica">Ubicación Física en Planta</Label>
                                    <Input
                                        id="ubicacion_fisica"
                                        placeholder="Ej. Recepción, Comedor, Caseta 1, o ???"
                                        value={data.ubicacion_fisica}
                                        onChange={(e) => setData('ubicacion_fisica', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 2 y 3 lado a lado: Equipo Actual vs Nuevo Biométrico */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Bloque Equipo Actual */}
                            <div className="rounded-xl border bg-slate-50/60 dark:bg-slate-900/30 p-4 space-y-4">
                                <div className="flex items-center justify-between border-b pb-2.5">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Server className="h-4 w-4 text-indigo-600" />
                                        2. Equipo Actual
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">Instalado</span>
                                        <Switch
                                            checked={Boolean(data.actual_instalado)}
                                            onCheckedChange={(v) => setData('actual_instalado', v)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="actual_no_serie">No. Serie Actual</Label>
                                        <Input
                                            id="actual_no_serie"
                                            placeholder="Ej. 543726588"
                                            value={data.actual_no_serie}
                                            onChange={(e) => setData('actual_no_serie', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="actual_ip">Dirección IP Actual</Label>
                                        <Input
                                            id="actual_ip"
                                            placeholder="Ej. 10.42.134.134"
                                            value={data.actual_ip}
                                            onChange={(e) => setData('actual_ip', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="actual_mascara">Mask / Subnet</Label>
                                        <Input
                                            id="actual_mascara"
                                            placeholder="Ej. 255.255.255.192"
                                            value={data.actual_mascara}
                                            onChange={(e) => setData('actual_mascara', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="actual_gateway">Gateway</Label>
                                        <Input
                                            id="actual_gateway"
                                            placeholder="Ej. 10.42.134.129"
                                            value={data.actual_gateway}
                                            onChange={(e) => setData('actual_gateway', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="actual_comentario">Comentario Actual</Label>
                                    <Textarea
                                        id="actual_comentario"
                                        rows={2}
                                        placeholder="Ej. S/N, Cierre de planta, Oficinas en remodelación..."
                                        value={data.actual_comentario}
                                        onChange={(e) => setData('actual_comentario', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Bloque Nuevo Biométrico */}
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15 p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2.5">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-emerald-600" />
                                        3. Nuevo Biométrico
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">Instalado</span>
                                        <Switch
                                            checked={Boolean(data.nuevo_instalado)}
                                            onCheckedChange={(v) => setData('nuevo_instalado', v)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_marca">Marca (Opcional)</Label>
                                        <Input
                                            id="nuevo_marca"
                                            placeholder="Ej. ZKTeco, Suprema, GTI..."
                                            value={data.nuevo_marca}
                                            onChange={(e) => setData('nuevo_marca', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_modelo">Modelo (Opcional)</Label>
                                        <Input
                                            id="nuevo_modelo"
                                            placeholder="Ej. SpeedFace V5L, SFace900..."
                                            value={data.nuevo_modelo}
                                            onChange={(e) => setData('nuevo_modelo', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_no_serie">No. Serie Nuevo</Label>
                                        <Input
                                            id="nuevo_no_serie"
                                            placeholder="Número de serie nuevo"
                                            value={data.nuevo_no_serie}
                                            onChange={(e) => setData('nuevo_no_serie', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_ip">Dirección IP Nueva</Label>
                                        <Input
                                            id="nuevo_ip"
                                            placeholder="Ej. 10.52.134.50"
                                            value={data.nuevo_ip}
                                            onChange={(e) => setData('nuevo_ip', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_mascara">Mask / Subnet Nuevo</Label>
                                        <Input
                                            id="nuevo_mascara"
                                            placeholder="Ej. 255.255.255.0"
                                            value={data.nuevo_mascara}
                                            onChange={(e) => setData('nuevo_mascara', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nuevo_gateway">Gateway Nuevo</Label>
                                        <Input
                                            id="nuevo_gateway"
                                            placeholder="Ej. 10.52.134.1"
                                            value={data.nuevo_gateway}
                                            onChange={(e) => setData('nuevo_gateway', e.target.value)}
                                        />
                                    </div>

                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label htmlFor="nuevo_mac_address">MAC Address</Label>
                                        <Input
                                            id="nuevo_mac_address"
                                            placeholder="Ej. 00:17:61:11:F0:FC"
                                            value={data.nuevo_mac_address}
                                            onChange={(e) => setData('nuevo_mac_address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="nuevo_comentario">Comentario Nuevo</Label>
                                    <Textarea
                                        id="nuevo_comentario"
                                        rows={2}
                                        placeholder="Observaciones de instalación del nuevo equipo..."
                                        value={data.nuevo_comentario}
                                        onChange={(e) => setData('nuevo_comentario', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Biométrico Setup'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Importación Masiva (con separación automática) */}
            <EquiposUbicacionesImportModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                defaultScope="ambos"
            />

            {/* Confirmación de Eliminación */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Registro de Biométrico Setup</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar el equipo de{' '}
                            <strong>{deletingItem?.localidad_nombre}</strong> ({deletingItem?.ubicacion_fisica || '???'})?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

