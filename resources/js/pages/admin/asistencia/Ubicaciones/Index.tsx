import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Cpu,
    FileSpreadsheet,
    Globe2,
    Layers,
    MapPin,
    MoreVertical,
    Pencil,
    Plus,
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
import { notifyError, notifySuccess } from '@/utils/notifications';
import EquiposUbicacionesImportModal from '../Partials/EquiposUbicacionesImportModal';

interface SucursalOption {
    id: number;
    nombre: string;
    zona_horaria?: string | null;
    empresa_id: number;
}

interface EmpresaOption {
    id: number;
    razon_social: string;
}

interface RelojUbicacion {
    id: number;
    empresa_id: number | null;
    sucursal_id: number | null;
    numero_localidad: number | null;
    planta: string;
    direccion: string | null;
    estado: string | null;
    ciudad: string | null;
    legacy: string | null;
    activo: boolean;
    equipos_biometricos_count?: number;
    sucursal?: {
        id: number;
        nombre: string;
        zona_horaria?: string | null;
    } | null;
}

interface UbicacionesPageProps {
    ubicaciones: Paginated<RelojUbicacion>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        estados_count: number;
        total_equipos: number;
        por_legacy: Record<string, number>;
    };
    estadosDisponibles: string[];
    legaciesDisponibles: string[];
    sucursales: SucursalOption[];
    empresas: EmpresaOption[];
    filters: {
        search?: string;
        legacy?: string;
        estado?: string;
        status?: string;
        perPage?: string;
    };
}

const initialForm = {
    empresa_id: '' as string | number,
    sucursal_id: '' as string | number,
    numero_localidad: '' as string | number,
    planta: '',
    direccion: '',
    estado: '',
    ciudad: '',
    legacy: '',
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

export default function RelojUbicacionesIndexPage({
    ubicaciones,
    stats,
    estadosDisponibles,
    legaciesDisponibles,
    sucursales,
    empresas,
    filters,
}: UbicacionesPageProps) {
    const { can } = usePermission();
    const canManage = can('asistencia.configuracion');

    const breadcrumbs = [
        { title: 'Panel de control', href: '/dashboard' },
        { title: 'Reloj Checador', href: '/admin/asistencia/ubicaciones' },
        { title: 'Ubicaciones (Plantas)', href: '/admin/asistencia/ubicaciones' },
    ];

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [legacyFilter, setLegacyFilter] = useState(filters.legacy || 'all');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '15');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingUbicacion, setEditingUbicacion] = useState<RelojUbicacion | null>(null);
    const [deletingUbicacion, setDeletingUbicacion] = useState<RelojUbicacion | null>(null);

    const { data, setData, post, put, reset, errors, processing } = useForm(initialForm);

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/asistencia/ubicaciones',
                cleanParams({
                    search: searchTerm,
                    legacy: legacyFilter === 'all' ? '' : legacyFilter,
                    estado: estadoFilter === 'all' ? '' : estadoFilter,
                    status: statusFilter === 'all' ? '' : statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, legacyFilter, estadoFilter, statusFilter, perPageFilter]);

    const handleCreateClick = () => {
        setEditingUbicacion(null);
        reset();
        setData({
            ...initialForm,
            empresa_id: empresas.length === 1 ? empresas[0].id : '',
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (ubicacion: RelojUbicacion) => {
        setEditingUbicacion(ubicacion);
        setData({
            empresa_id: ubicacion.empresa_id ?? (empresas[0]?.id || ''),
            sucursal_id: ubicacion.sucursal_id ?? '',
            numero_localidad: ubicacion.numero_localidad ?? '',
            planta: ubicacion.planta || '',
            direccion: ubicacion.direccion || '',
            estado: ubicacion.estado || '',
            ciudad: ubicacion.ciudad || '',
            legacy: ubicacion.legacy || '',
            activo: Boolean(ubicacion.activo),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            sucursal_id: data.sucursal_id === '' || data.sucursal_id === 'none' ? null : Number(data.sucursal_id),
            numero_localidad: data.numero_localidad === '' ? null : Number(data.numero_localidad),
        };

        if (editingUbicacion) {
            router.put(`/admin/asistencia/ubicaciones/${editingUbicacion.id}`, payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingUbicacion(null);
                    reset();
                },
                onError: () => notifyError('Por favor verifica los campos del formulario.'),
            });
        } else {
            router.post('/admin/asistencia/ubicaciones', payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                onError: () => notifyError('Por favor verifica los campos del formulario.'),
            });
        }
    };

    const handleToggleStatus = (ubicacion: RelojUbicacion) => {
        router.patch(
            `/admin/asistencia/ubicaciones/${ubicacion.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDeleteConfirm = () => {
        if (!deletingUbicacion) return;
        router.delete(`/admin/asistencia/ubicaciones/${deletingUbicacion.id}`, {
            onSuccess: () => setDeletingUbicacion(null),
        });
    };

    const columns: ColumnDef<RelojUbicacion>[] = [
        {
            header: 'Núm.',
            className: 'w-20',
            cell: (u) => (
                <div className="flex items-center">
                    {u.numero_localidad !== null ? (
                        <span className="inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                            #{u.numero_localidad}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground font-mono">S/N</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Planta / Localidad',
            cell: (u) => (
                <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">{u.planta}</p>
                    {u.sucursal && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Sucursal vinculada: {u.sucursal.nombre}
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: 'Legacy',
            cell: (u) =>
                u.legacy ? (
                    <span
                        className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                            getLegacyBadgeStyle(u.legacy)
                        )}
                    >
                        {u.legacy}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            header: 'Estado / Ciudad',
            hideOn: 'mobile',
            cell: (u) => (
                <div className="space-y-0.5 text-xs">
                    <p className="font-medium text-foreground">{u.estado || '—'}</p>
                    {u.ciudad && <p className="text-muted-foreground">{u.ciudad}</p>}
                </div>
            ),
        },
        {
            header: 'Dirección Física',
            hideOn: 'mobile',
            cell: (u) => (
                <p className="text-xs text-muted-foreground max-w-md line-clamp-2" title={u.direccion || ''}>
                    {u.direccion || '—'}
                </p>
            ),
        },
        {
            header: 'Biométricos',
            stopRowClick: true,
            cell: (u) => {
                const count = u.equipos_biometricos_count ?? 0;
                return (
                    <Link
                        href={
                            u.numero_localidad
                                ? `/admin/asistencia/biometricos-setup?numero_localidad=${u.numero_localidad}`
                                : `/admin/asistencia/biometricos-setup?reloj_ubicacion_id=${u.id}`
                        }
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition',
                            count > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        <Cpu className="h-3.5 w-3.5" />
                        {count} {count === 1 ? 'equipo' : 'equipos'}
                    </Link>
                );
            },
        },
        {
            header: 'Estado',
            stopRowClick: true,
            cell: (u) => (
                <div className="flex items-center gap-2">
                    <Switch
                        disabled={!canManage}
                        checked={Boolean(u.activo)}
                        onCheckedChange={() => canManage && handleToggleStatus(u)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            u.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {u.activo ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Acciones',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (u) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link
                                href={
                                    u.numero_localidad
                                        ? `/admin/asistencia/biometricos-setup?numero_localidad=${u.numero_localidad}`
                                        : `/admin/asistencia/biometricos-setup?reloj_ubicacion_id=${u.id}`
                                }
                            >
                                <Cpu className="mr-2 h-4 w-4" />
                                Ver Biométricos de esta Planta
                            </Link>
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuItem onClick={() => handleEditClick(u)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar Ubicación
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {u.activo ? 'Desactivar' : 'Activar'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeletingUbicacion(u)}
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
            <Head title="Ubicaciones de Plantas - Reloj Checador" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<MapPin className="h-6 w-6 text-white" />}
                    title="Ubicaciones de Plantas (Catálogo Maestro)"
                    description="Administra el catálogo de localidades, direcciones físicas, estados y organizaciones Legacy vinculadas a los relojes checadores."
                    colorClassName="bg-indigo-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                            <Link href="/admin/asistencia/biometricos-setup">
                                <Cpu className="mr-2 h-4 w-4" />
                                Ir a Biométricos Setup
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
                                    Nueva Ubicación
                                </Button>
                            </>
                        )}
                    </div>
                </ModuleHeader>

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<MapPin className="h-6 w-6" />}
                        title="TOTAL UBICACIONES"
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title="UBICACIONES ACTIVAS"
                        value={stats.activos}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<Globe2 className="h-6 w-6" />}
                        title="ESTADOS CON PRESENCIA"
                        value={stats.estados_count}
                        colorClassName="bg-sky-100 text-sky-600"
                    />
                    <StatCard
                        icon={<Cpu className="h-6 w-6" />}
                        title="EQUIPOS BIOMÉTRICOS"
                        value={stats.total_equipos}
                        colorClassName="bg-violet-100 text-violet-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label="Buscar">
                            <Input
                                placeholder="Buscar por Núm., planta, dirección, ciudad..."
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label="Legacy">
                            <Select value={legacyFilter} onValueChange={setLegacyFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Todos los Legacy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Legacy</SelectItem>
                                    {legaciesDisponibles.map((leg) => (
                                        <SelectItem key={leg} value={leg}>
                                            {leg}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="sin_legacy">Sin Legacy (Victory)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Estado">
                            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue placeholder="Todos los estados" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    {estadosDisponibles.map((est) => (
                                        <SelectItem key={est} value={est}>
                                            {est}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Estatus">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Activas</SelectItem>
                                    <SelectItem value="0">Inactivas</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* Tabla de Datos */}
                <DataTable
                    data={ubicaciones}
                    columns={columns}
                    filters={filters}
                    onRowClick={(u) => canManage && handleEditClick(u)}
                />
            </div>

            {/* Modal Crear / Editar Ubicación */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[760px] max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUbicacion ? 'Editar Ubicación de Planta' : 'Nueva Ubicación de Planta'}
                        </DialogTitle>
                        <DialogDescription>
                            Completa los datos correspondientes a la Pestaña 3 (Ubicaciones (2)) del catálogo maestro.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-3 space-y-2">
                                <Label htmlFor="numero_localidad">Núm. Localidad</Label>
                                <Input
                                    id="numero_localidad"
                                    type="number"
                                    min={1}
                                    placeholder="Ej. 13, 26..."
                                    value={data.numero_localidad}
                                    onChange={(e) => setData('numero_localidad', e.target.value)}
                                />
                                {errors.numero_localidad && (
                                    <p className="text-xs text-red-500">{errors.numero_localidad}</p>
                                )}
                            </div>

                            <div className="md:col-span-6 space-y-2">
                                <Label htmlFor="planta">Nombre de Planta / Localidad *</Label>
                                <Input
                                    id="planta"
                                    placeholder="Ej. CORRUGADO TIJUANA – BODEGA 6"
                                    value={data.planta}
                                    onChange={(e) => setData('planta', e.target.value)}
                                    required
                                />
                                {errors.planta && <p className="text-xs text-red-500">{errors.planta}</p>}
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <Label htmlFor="legacy">Legacy</Label>
                                <Select
                                    value={data.legacy || 'none'}
                                    onValueChange={(val) => setData('legacy', val === 'none' ? '' : val)}
                                >
                                    <SelectTrigger id="legacy">
                                        <SelectValue placeholder="Seleccionar..." />
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado</Label>
                                <Input
                                    id="estado"
                                    placeholder="Ej. Baja California Norte, Nuevo Leon..."
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ciudad">Ciudad / Municipio</Label>
                                <Input
                                    id="ciudad"
                                    placeholder="Ej. Tijuana, Guadalupe, Ecatepec..."
                                    value={data.ciudad}
                                    onChange={(e) => setData('ciudad', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección Física Completa</Label>
                            <Textarea
                                id="direccion"
                                rows={3}
                                placeholder="Calle, número, parque industrial, colonia, código postal..."
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1">
                            <div className="space-y-2">
                                <Label htmlFor="sucursal_id">Vincular con Sucursal del Sistema (Opcional)</Label>
                                <Select
                                    value={data.sucursal_id ? String(data.sucursal_id) : 'none'}
                                    onValueChange={(val) => setData('sucursal_id', val === 'none' ? '' : Number(val))}
                                >
                                    <SelectTrigger id="sucursal_id">
                                        <SelectValue placeholder="Sin vincular" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin vincular</SelectItem>
                                        {sucursales.map((suc) => (
                                            <SelectItem key={suc.id} value={String(suc.id)}>
                                                {suc.nombre} {suc.zona_horaria ? `(${suc.zona_horaria})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border p-3.5 mt-4 md:mt-6">
                                <div>
                                    <p className="text-sm font-medium">Ubicación Activa</p>
                                    <p className="text-xs text-muted-foreground">Disponible en el catálogo de equipos</p>
                                </div>
                                <Switch
                                    checked={Boolean(data.activo)}
                                    onCheckedChange={(checked) => setData('activo', checked)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Ubicación'}
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
            <AlertDialog open={!!deletingUbicacion} onOpenChange={(open) => !open && setDeletingUbicacion(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Ubicación de Planta</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar la ubicación{' '}
                            <strong>{deletingUbicacion?.planta}</strong>? Los equipos biométricos asociados conservarán su nombre de localidad pero quedarán desvinculados de esta ficha.
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

