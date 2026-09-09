import { Head, useForm, router } from '@inertiajs/react';
import {
    GitBranch,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Phone,
    MapPin,
    Building2,
    Clock,
} from 'lucide-react';
import React, { useState, Suspense, lazy, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useGeocoding } from '@/hooks/use-geocoding';
import { useTranslate } from '@/hooks/use-translate';
import { isValidLatLng } from '@/lib/geocoding';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';

const SucursalMapComponent = lazy(() => {
    return import('../Empresas/Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
    latitud?: number | null;
    longitud?: number | null;
}

interface Empresa {
    id: number;
    razon_social: string;
    logo?: string | null;
    logo_mini?: string | null;
}

interface Sucursal {
    id: number;
    empresa_id: number;
    nombre: string;
    codigo_numeral?: string | null;
    pais_telefono_id?: number | string | null;
    pais_id?: number | string | null;
    telefono?: string | null;
    direccion?: string | null;
    codigo_postal?: string | null;
    colonia?: string | null;
    ciudad?: string | null;
    estado?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    zona_horaria?: string | null;
    status: boolean;
    empresa?: Empresa | null;
}

interface SucursalesPageProps {
    auth: Auth;
    sucursales: Paginated<Sucursal>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    empresas: Empresa[];
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        empresa_id?: string;
        perPage?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    empresa_id:       '' as string | number,
    nombre:           '',
    codigo_numeral:   '01',
    pais_telefono_id: '' as string | number,
    pais_id:          '' as string | number,
    telefono:         '',
    direccion:        '',
    codigo_postal:    '',
    colonia:          '',
    ciudad:           '',
    estado:           '',
    latitud:          null as number | null,
    longitud:         null as number | null,
    zona_horaria:     '',
    status:           true as boolean,
};

type CoordsSource = 'none' | 'geocode' | 'map' | 'manual';

// ─── Página principal ──────────────────────────────────────────────────────────

export default function SucursalesIndexPage({
    auth, sucursales, stats, empresas, paises, filters,
}: SucursalesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Branches'), href: '/admin/sucursales' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [editingSucursal, setEditingSucursal]   = useState<Sucursal | null>(null);
    const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null);
    const [activeTab, setActiveTab]               = useState('general');
    const [isTableLoading, setIsTableLoading]     = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]         = useState(filters.search || '');
    const [statusFilter, setStatusFilter]     = useState(filters.status || '');
    const [empresaFilter, setEmpresaFilter]   = useState(filters.empresa_id || '');
    const [perPageFilter, setPerPageFilter]   = useState(filters.perPage || '10');

    // ── Hooks de navegación ────────────────────────────────────────────────────
    React.useEffect(() => {
        const unbindStart  = router.on('start',  () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
 unbindStart(); unbindFinish(); 
};
    }, []);

    // Debounce de filtros
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search:     searchTerm,
                    status:     statusFilter,
                    empresa_id: empresaFilter,
                    perPage:    perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, empresaFilter, perPageFilter]);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset, transform } = useForm(initialForm);

    // ── Mapa / geocodificación ─────────────────────────────────────────────────
    const coordsSourceRef = useRef<CoordsSource>('none');
    const { geocode: runGeocode, loading: geocoding } = useGeocoding({ country: 'mx' });

    const latNum = data.latitud != null && data.latitud !== ('' as unknown) ? Number(data.latitud) : null;
    const lngNum = data.longitud != null && data.longitud !== ('' as unknown) ? Number(data.longitud) : null;
    const hasCoords = latNum !== null && lngNum !== null && isValidLatLng(latNum, lngNum);

    // País de ubicación (independiente del prefijo telefónico).
    const paisSeleccionado = useMemo(
        () => paises.find((p) => p.id === Number(data.pais_id)),
        [paises, data.pais_id],
    );

    const mapCenter = useMemo<[number, number]>(() => {
        if (hasCoords) {
            return [latNum as number, lngNum as number];
        }

        if (paisSeleccionado?.latitud && paisSeleccionado?.longitud) {
            return [Number(paisSeleccionado.latitud), Number(paisSeleccionado.longitud)];
        }

        return [23.6345, -102.5528];
    }, [hasCoords, latNum, lngNum, paisSeleccionado]);

    const mapZoom = useMemo(
        () => (hasCoords ? 14 : paisSeleccionado ? 6 : 4),
        [hasCoords, paisSeleccionado],
    );

    const markerPosition = useMemo<[number, number] | null>(
        () => (hasCoords ? [latNum as number, lngNum as number] : null),
        [hasCoords, latNum, lngNum],
    );

    const buildGeocodeQuery = useCallback(() => {
        return [data.direccion, data.colonia, data.ciudad, data.estado, data.codigo_postal, paisSeleccionado?.nombre]
            .map((s) => (s ?? '').toString().trim())
            .filter(Boolean)
            .join(', ');
    }, [data.direccion, data.colonia, data.ciudad, data.estado, data.codigo_postal, paisSeleccionado?.nombre]);

    const applyGeocode = useCallback(
        (result: Parameters<Parameters<typeof runGeocode>[1]>[0], force: boolean) => {
            if (!result) {
                if (force) {
                    notifyError(__('The address could not be located on the map.'));
                }

                return;
            }

            if (!force && (coordsSourceRef.current === 'map' || coordsSourceRef.current === 'manual')) {
                return;
            }

            coordsSourceRef.current = force ? 'map' : 'geocode';
            setData((prev) => ({
                ...prev,
                latitud: result.lat,
                longitud: result.lng,
                colonia: prev.colonia || result.colonia || '',
                ciudad: prev.ciudad || result.ciudad || '',
                estado: prev.estado || result.estado || '',
                codigo_postal: prev.codigo_postal || result.codigo_postal || '',
            }));
        },
        [setData, __],
    );

    const geocodeQuery = buildGeocodeQuery();
    useEffect(() => {
        if (!isModalOpen || activeTab !== 'ubicacion') {
            return;
        }

        if (coordsSourceRef.current === 'map' || coordsSourceRef.current === 'manual') {
            return;
        }

        if (geocodeQuery.length < 6) {
            return;
        }

        runGeocode(geocodeQuery, (result) => applyGeocode(result, false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen, activeTab, geocodeQuery]);

    const handleForceGeocode = useCallback(() => {
        const query = buildGeocodeQuery();

        if (query.length < 6) {
            notifyError(__('Enter more address details to locate it on the map.'));

            return;
        }

        runGeocode(query, (result) => applyGeocode(result, true), true);
    }, [buildGeocodeQuery, runGeocode, applyGeocode, __]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingSucursal(null);
        reset();
        coordsSourceRef.current = 'none';
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (sucursal: Sucursal) => {
        setEditingSucursal(sucursal);
        coordsSourceRef.current = sucursal.latitud != null && sucursal.longitud != null ? 'manual' : 'none';
        setData({
            empresa_id:       sucursal.empresa_id,
            nombre:           sucursal.nombre || '',
            codigo_numeral:   sucursal.codigo_numeral || '01',
            pais_telefono_id: sucursal.pais_telefono_id ?? '',
            pais_id:          sucursal.pais_id ?? '',
            telefono:         sucursal.telefono || '',
            direccion:        sucursal.direccion || '',
            codigo_postal:    sucursal.codigo_postal || '',
            colonia:          sucursal.colonia || '',
            ciudad:           sucursal.ciudad || '',
            estado:           sucursal.estado || '',
            latitud:          sucursal.latitud ?? null,
            longitud:         sucursal.longitud ?? null,
            zona_horaria:     sucursal.zona_horaria || '',
            status:           sucursal.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const hasLat = data.latitud !== null && String(data.latitud) !== '';
        const hasLng = data.longitud !== null && String(data.longitud) !== '';

        if (hasLat !== hasLng) {
            notifyError(__('Latitude and longitude must both be set, or both empty.'));

            return;
        }

        if (hasLat && hasLng && !isValidLatLng(Number(data.latitud), Number(data.longitud))) {
            notifyError(__('The coordinates are out of range.'));

            return;
        }

        transform((current) => ({
            ...current,
            latitud: hasLat ? Number(current.latitud) : null,
            longitud: hasLng ? Number(current.longitud) : null,
        }));

        if (editingSucursal) {
            put(`/admin/sucursales/${editingSucursal.id}`, {
                onSuccess: () => {
                    coordsSourceRef.current = 'none';
                    setIsModalOpen(false);
                    setEditingSucursal(null);
                    reset();
                    notifySuccess(__('Branch updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/sucursales', {
                onSuccess: () => {
                    coordsSourceRef.current = 'none';
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Branch created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (sucursal: Sucursal) => {
        router.patch(`/admin/sucursales/${sucursal.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingSucursal) {
return;
}

        router.delete(`/admin/sucursales/${deletingSucursal.id}`, {
            onSuccess: () => {
                setDeletingSucursal(null);
                notifySuccess(__('Branch deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the branch. Please try again.')),
        });
    };

    const handleLocationSelected = useCallback(
        (
            lat: number,
            lng: number,
            address?: string,
            timezone?: string,
            details?: { codigo_postal?: string; colonia?: string; ciudad?: string; estado?: string },
        ) => {
            coordsSourceRef.current = 'map';
            setData((prev) => ({
                ...prev,
                latitud: lat,
                longitud: lng,
                ...(address ? { direccion: address } : {}),
                ...(timezone ? { zona_horaria: timezone } : {}),
                ...(details?.codigo_postal && !prev.codigo_postal ? { codigo_postal: details.codigo_postal } : {}),
                ...(details?.colonia && !prev.colonia ? { colonia: details.colonia } : {}),
                ...(details?.ciudad && !prev.ciudad ? { ciudad: details.ciudad } : {}),
                ...(details?.estado && !prev.estado ? { estado: details.estado } : {}),
            }));
        },
        [setData],
    );

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Sucursal>[] = [
        {
            header: 'Branch',
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (sucursal) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{sucursal.nombre}</p>
                        {sucursal.direccion && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{sucursal.direccion}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Company',
            accessorKey: 'empresa',
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="flex items-center gap-2">
                    {sucursal.empresa?.logo_mini || sucursal.empresa?.logo ? (
                        <img
                            src={sucursal.empresa.logo_mini || sucursal.empresa.logo || ''}
                            alt={sucursal.empresa.razon_social}
                            className="w-6 h-6 rounded object-cover border"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {sucursal.empresa?.razon_social ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Contact',
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="space-y-0.5">
                    {sucursal.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {sucursal.telefono}
                        </div>
                    )}
                    {sucursal.latitud && sucursal.longitud && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {Number(sucursal.latitud).toFixed(4)}, {Number(sucursal.longitud).toFixed(4)}
                        </div>
                    )}
                    {!sucursal.telefono && !sucursal.latitud && (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Time Zone'),
            hideOn: 'mobile',
            cell: (sucursal) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{sucursal.zona_horaria || __('Default')}</span>
                </div>
            ),
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (sucursal) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={sucursal.status}
                        onCheckedChange={() => handleToggleStatus(sucursal)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        sucursal.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {sucursal.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (sucursal) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(sucursal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(sucursal)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {sucursal.status ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingSucursal(sucursal)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={__('Branches')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<GitBranch className="h-6 w-6 text-white" />}
                    title={__('Branches')}
                    description={__('Manage company branches, their locations and contact information.')}
                    colorClassName="bg-violet-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Branch')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<GitBranch className="h-6 w-6" />}
                        title={__('TOTAL BRANCHES')}
                        value={stats.total}
                        colorClassName="bg-violet-100 text-violet-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE')}
                        value={stats.activos}
                        colorClassName="bg-green-100 text-green-600"
                    />
                    <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        title={__('INACTIVE')}
                        value={stats.inactivos}
                        colorClassName="bg-red-100 text-red-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, phone, address...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Company')}>
                            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                                <SelectTrigger className="w-full md:w-56">
                                    <SelectValue placeholder={__('All companies')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All companies')}</SelectItem>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.razon_social}
                                        </SelectItem>
                                    ))}
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
                                <SelectTrigger className="w-full md:w-40">
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

                {/* Tabla */}
                <div className="w-full">
                    <DataTable
                        data={sucursales}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(sucursal) => handleEditClick(sucursal)}
                        emptyState={{
                            title: 'No branches found',
                            description: searchTerm || statusFilter || empresaFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any branches yet.',
                            ctaLabel: 'New Branch',
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ── Modal Creación / Edición ────────────────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingSucursal ? __('Edit Branch') : __('New Branch')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Complete the branch information across the available sections.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                            <TabsList className="grid grid-cols-2 w-full mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4" />
                                    {__('General')}
                                </TabsTrigger>
                                <TabsTrigger value="ubicacion" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {__('Location')}
                                </TabsTrigger>
                            </TabsList>

                            {/* ══ Tab 1: General ══════════════════════════════════════════════════ */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Empresa */}
                                    <div>
                                        <Label htmlFor="empresa_id">{__('Company')} *</Label>
                                        <Select
                                            value={String(data.empresa_id)}
                                            onValueChange={(v) => setData('empresa_id', v)}
                                        >
                                            <SelectTrigger id="empresa_id" className="w-full h-10 text-sm">
                                                <SelectValue placeholder={__('Select a company')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {empresas.map((emp) => (
                                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                                        <div className="flex items-center gap-2">
                                                            {emp.logo_mini || emp.logo ? (
                                                                <img
                                                                    src={emp.logo_mini || emp.logo || ''}
                                                                    alt={emp.razon_social}
                                                                    className="w-4 h-4 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                            )}
                                                            {emp.razon_social}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.empresa_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>
                                        )}
                                    </div>

                                    {/* Nombre */}
                                    <div>
                                        <Label htmlFor="nombre">{__('Branch Name')} *</Label>
                                        <Input
                                            id="nombre"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            placeholder="Ej: Sucursal Centro"
                                            className="h-10 text-sm"
                                        />
                                        {errors.nombre && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                                        )}
                                    </div>

                                    {/* Numeral Planta (Código de Acceso) */}
                                    <div>
                                        <Label htmlFor="codigo_numeral">Numeral Planta (Ej: 01 Purépero, 02 Tuxcueca) *</Label>
                                        <Input
                                            id="codigo_numeral"
                                            value={data.codigo_numeral}
                                            onChange={(e) => setData('codigo_numeral', e.target.value)}
                                            placeholder="01"
                                            maxLength={2}
                                            className="h-10 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                                        />
                                        {errors.codigo_numeral && (
                                            <p className="text-red-500 text-xs mt-1">{errors.codigo_numeral}</p>
                                        )}
                                    </div>

                                    {/* Teléfono */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="telefono">{__('Phone')}</Label>
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={data.pais_telefono_id}
                                            phoneValue={data.telefono || ''}
                                            onPaisChange={(v) => setData('pais_telefono_id', v)}
                                            onPhoneChange={(v) => setData('telefono', v)}
                                            placeholder="000-0000000"
                                            error={errors.telefono}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="status">{__('Status')}</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="status"
                                                checked={data.status}
                                                onCheckedChange={(checked) => setData('status', checked)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {data.status ? __('Active') : __('Inactive')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Ubicación ══════════════════════════════════════════════════ */}
                            <TabsContent value="ubicacion" className="space-y-4">
                                {/* País de ubicación */}
                                <div>
                                    <Label htmlFor="pais_id">{__('Country')}</Label>
                                    <Select
                                        value={String(data.pais_id)}
                                        onValueChange={(v) => {
                                            coordsSourceRef.current = 'none';
                                            setData((prev) => ({ ...prev, pais_id: v, latitud: null, longitud: null }));
                                        }}
                                    >
                                        <SelectTrigger id="pais_id" className="w-full">
                                            <SelectValue placeholder={__('Select a country')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">{__('None')}</SelectItem>
                                            {paises.map((pais) => (
                                                <SelectItem key={pais.id} value={String(pais.id)}>
                                                    {pais.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.pais_id && <p className="text-red-500 text-xs mt-1">{errors.pais_id}</p>}
                                </div>

                                {/* Dirección estructurada */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="ciudad">{__('City')}</Label>
                                        <Input
                                            id="ciudad"
                                            value={data.ciudad || ''}
                                            onChange={(e) => setData('ciudad', e.target.value)}
                                            placeholder="Ej: Purépero"
                                        />
                                        {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="estado">{__('State')}</Label>
                                        <Input
                                            id="estado"
                                            value={data.estado || ''}
                                            onChange={(e) => setData('estado', e.target.value)}
                                            placeholder="Ej: Michoacán"
                                        />
                                        {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="colonia">{__('Neighborhood')}</Label>
                                        <Input
                                            id="colonia"
                                            value={data.colonia || ''}
                                            onChange={(e) => setData('colonia', e.target.value)}
                                            placeholder="Ej: Centro"
                                        />
                                        {errors.colonia && <p className="text-red-500 text-xs mt-1">{errors.colonia}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="codigo_postal">{__('Postal Code')}</Label>
                                        <Input
                                            id="codigo_postal"
                                            value={data.codigo_postal || ''}
                                            onChange={(e) => setData('codigo_postal', e.target.value)}
                                            placeholder="Ej: 58540"
                                        />
                                        {errors.codigo_postal && (
                                            <p className="text-red-500 text-xs mt-1">{errors.codigo_postal}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div>
                                    <Label htmlFor="direccion">{__('Address')}</Label>
                                    <Textarea
                                        id="direccion"
                                        value={data.direccion || ''}
                                        onChange={(e) => setData('direccion', e.target.value)}
                                        placeholder={__('Street and number, or click on the map...')}
                                        rows={2}
                                    />
                                    {errors.direccion && (
                                        <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleForceGeocode}
                                        disabled={geocoding}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        {geocoding ? __('Locating...') : __('Locate address on map')}
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        {__('Or click / drag the marker on the map for precise coordinates.')}
                                    </span>
                                </div>

                                {/* Coordenadas (prevalecen sobre la dirección) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="latitud">{__('Latitude')}</Label>
                                        <Input
                                            id="latitud"
                                            type="number"
                                            step="any"
                                            value={data.latitud ?? ''}
                                            onChange={(e) => {
                                                coordsSourceRef.current = 'manual';
                                                setData('latitud', e.target.value ? parseFloat(e.target.value) : null);
                                            }}
                                            placeholder="19.92"
                                        />
                                        {errors.latitud && <p className="text-red-500 text-xs mt-1">{errors.latitud}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="longitud">{__('Longitude')}</Label>
                                        <Input
                                            id="longitud"
                                            type="number"
                                            step="any"
                                            value={data.longitud ?? ''}
                                            onChange={(e) => {
                                                coordsSourceRef.current = 'manual';
                                                setData('longitud', e.target.value ? parseFloat(e.target.value) : null);
                                            }}
                                            placeholder="-102.01"
                                        />
                                        {errors.longitud && (
                                            <p className="text-red-500 text-xs mt-1">{errors.longitud}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="zona_horaria">{__('Time Zone')}</Label>
                                        <Input
                                            id="zona_horaria"
                                            value={data.zona_horaria || ''}
                                            onChange={(e) => setData('zona_horaria', e.target.value)}
                                            placeholder="America/Mexico_City"
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Mapa */}
                                <div
                                    style={{ height: '380px', width: '100%' }}
                                    className="rounded-md overflow-hidden border flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                                >
                                    <Suspense
                                        fallback={
                                            <p className="text-slate-500 text-sm">{__('Loading map...')}</p>
                                        }
                                    >
                                        {isModalOpen && activeTab === 'ubicacion' && (
                                            <SucursalMapComponent
                                                center={mapCenter}
                                                zoom={mapZoom}
                                                style={{ height: '100%', width: '100%' }}
                                                markerPosition={markerPosition}
                                                onLocationSelected={handleLocationSelected}
                                            />
                                        )}
                                    </Suspense>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {__('Click on the map to set the exact location. The address will be obtained automatically.')}
                                </p>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-6 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={processing}
                            >
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── AlertDialog de confirmación de eliminación ──────────────────────────── */}
            <AlertDialog open={!!deletingSucursal} onOpenChange={(open) => !open && setDeletingSucursal(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete Branch')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete the branch')}{' '}
                            <strong>{deletingSucursal?.nombre}</strong>?{' '}
                            {__(
                                'This action cannot be undone. This will also permanently delete its departments, positions, hosts, service visits and access/visit history.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {__('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
