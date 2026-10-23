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
    LocateFixed,
    Loader2,
} from 'lucide-react';
import React, { useRef, useState, Suspense, lazy } from 'react';
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
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import PhoneInputGroup from '../Empresas/Partials/PhoneInputGroup';
import { getTimezoneFromCoords } from '../Empresas/Partials/MapComponent';
import { usePermission } from '@/hooks/use-permission';
import { Can } from '@/components/can';

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
    telefono?: string | null;
    direccion?: string | null;
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
    telefono:         '',
    direccion:        '',
    latitud:          null as number | null,
    longitud:         null as number | null,
    zona_horaria:     '',
    status:           true as boolean,
};

// ─── Página principal ──────────────────────────────────────────────────────────

export default function SucursalesIndexPage({
    auth, sucursales, stats, empresas, paises, filters,
}: SucursalesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Branches'), href: '/admin/sucursales' },
    ];

    const { can } = usePermission();
    const canCreate = can('sucursales.create');
    const canEdit = can('sucursales.edit');
    const canDelete = can('sucursales.delete');

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
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Mapa ───────────────────────────────────────────────────────────────────
    const paisSeleccionado = paises.find((p) => p.id === Number(data.pais_telefono_id));
    const mapCenter: [number, number] =
        data.latitud && data.longitud
            ? [data.latitud, data.longitud]
            : paisSeleccionado?.latitud && paisSeleccionado?.longitud
            ? [paisSeleccionado.latitud, paisSeleccionado.longitud]
            : [4.6, -74.1];

    const mapZoom = data.latitud && data.longitud ? 14 : paisSeleccionado ? 6 : 4;

    const [geocoding, setGeocoding] = useState(false);
    const [locatingCurrent, setLocatingCurrent] = useState(false);
    // Origen de las coordenadas (se asigna al teclearlas); estaba sin declarar y rompía la edición manual.
    const coordsSourceRef = useRef<'manual' | 'map' | 'geocode'>('manual');

    const handleForceGeocode = async () => {
        if (!data.direccion || data.direccion.trim() === '') {
            notifyError(__('Please enter an address first.'));
            return;
        }

        setGeocoding(true);
        try {
            const query = encodeURIComponent(data.direccion.trim());
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${query}&limit=1`, {
                headers: {
                    'Accept-Language': 'es',
                },
            });
            const results = await response.json();
            if (results && results.length > 0) {
                const lat = Number(parseFloat(results[0].lat).toFixed(6));
                const lon = Number(parseFloat(results[0].lon).toFixed(6));
                const tz = await getTimezoneFromCoords(lat, lon, results[0].address);
                setData((prev) => ({
                    ...prev,
                    latitud: lat,
                    longitud: lon,
                    ...(tz ? { zona_horaria: tz } : {}),
                }));
                notifySuccess(__('Address located on map.'));
            } else {
                notifyError(__('Address could not be located on the map. Try dragging the marker manually.'));
            }
        } catch {
            notifyError(__('Error trying to geolocate address.'));
        } finally {
            setGeocoding(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            notifyError('Tu navegador no soporta geolocalización.');
            return;
        }

        setLocatingCurrent(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = Number(position.coords.latitude.toFixed(6));
                const lon = Number(position.coords.longitude.toFixed(6));

                const tz = await getTimezoneFromCoords(lat, lon);
                let detectedAddress = '';
                let finalTz = tz;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`,
                        { headers: { 'Accept-Language': 'es' } }
                    );
                    if (res.ok) {
                        const geoData = await res.json();
                        detectedAddress = geoData.display_name ?? '';
                        finalTz = (await getTimezoneFromCoords(lat, lon, geoData.address)) || tz;
                    }
                } catch {
                    // Ignorar error de dirección inversa
                }

                setData((prev) => ({
                    ...prev,
                    latitud: lat,
                    longitud: lon,
                    ...(detectedAddress ? { direccion: detectedAddress } : {}),
                    ...(finalTz ? { zona_horaria: finalTz } : {}),
                }));

                setLocatingCurrent(false);
                notifySuccess('Ubicación actual y zona horaria detectadas automáticamente.');
            },
            (err) => {
                setLocatingCurrent(false);
                if (err.code === err.PERMISSION_DENIED) {
                    notifyError('Permiso de ubicación denegado. Actívalo en el navegador para usar tu ubicación actual.');
                } else {
                    notifyError('No fue posible obtener la ubicación actual del dispositivo.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingSucursal(null);
        const defaultPais = paises.find((p) => p.codigo_iso2 === 'MX') || paises[0];
        const defaultEmpresa = auth.user?.empresa_id || empresas[0]?.id || '';
        setData({
            ...initialForm,
            empresa_id: defaultEmpresa,
            pais_telefono_id: defaultPais?.id ?? '',
            zona_horaria: 'America/Mexico_City',
            status: true,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (sucursal: Sucursal) => {
        setEditingSucursal(sucursal);
        const cleanPhone = (sucursal.telefono || '').replace(/^\+?52\s*/, '');
        setData({
            empresa_id:       sucursal.empresa_id,
            nombre:           sucursal.nombre || '',
            codigo_numeral:   sucursal.codigo_numeral || '01',
            pais_telefono_id: sucursal.pais_telefono_id ?? '',
            telefono:         cleanPhone,
            direccion:        sucursal.direccion || '',
            latitud:          sucursal.latitud ?? null,
            longitud:         sucursal.longitud ?? null,
            zona_horaria:     sucursal.zona_horaria || 'America/Mexico_City',
            status:           sucursal.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSucursal) {
            put(`/admin/sucursales/${editingSucursal.id}`, {
                onSuccess: () => {
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

    const handleLocationSelected = (lat: number, lng: number, address?: string, timezone?: string) => {
        setData((prev) => ({
            ...prev,
            latitud:  lat,
            longitud: lng,
            ...(address ? { direccion: address } : {}),
            ...(timezone ? { zona_horaria: timezone } : {}),
        }));
    };

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
                        disabled={!canEdit}
                        checked={sucursal.status}
                        onCheckedChange={() => canEdit && handleToggleStatus(sucursal)}
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
            cell: (sucursal) => {
                if (!canEdit && !canDelete) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canEdit && (
                                <>
                                    <DropdownMenuItem onClick={() => handleEditClick(sucursal)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {__('Edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleStatus(sucursal)}>
                                        <ToggleRight className="mr-2 h-4 w-4" />
                                        {sucursal.status ? __('Deactivate') : __('Activate')}
                                    </DropdownMenuItem>
                                </>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={() => setDeletingSucursal(sucursal)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {__('Delete')}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
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
                    <Can permission="sucursales.create">
                        <Button onClick={handleCreateClick}>
                            <Plus className="mr-2 h-4 w-4" />
                            {__('New Branch')}
                        </Button>
                    </Can>
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
                        onRowClick={canEdit ? (sucursal) => handleEditClick(sucursal) : undefined}
                        emptyState={{
                            title: 'No branches found',
                            description: searchTerm || statusFilter || empresaFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any branches yet.',
                            ctaLabel: canCreate ? 'New Branch' : undefined,
                            onCtaClick: canCreate ? handleCreateClick : undefined,
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
                            <TabsContent value="general" className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

                                    {/* Fila 1, Col 1: Empresa */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="empresa_id">{__('Company')} *</Label>
                                        <Select
                                            value={String(data.empresa_id)}
                                            onValueChange={(v) => setData('empresa_id', v)}
                                        >
                                            <SelectTrigger id="empresa_id" className="w-full text-sm">
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

                                    {/* Fila 1, Col 2: Nombre de Sucursal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombre">{__('Branch Name')} *</Label>
                                        <Input
                                            id="nombre"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            placeholder="Ej: Planta Cerro Gordo (LSKM)"
                                            className="text-sm"
                                        />
                                        {errors.nombre && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                                        )}
                                    </div>

                                    {/* Fila 2, Col 1: Numeral Planta (Código de Acceso) */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="codigo_numeral">Numeral de Planta *</Label>
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                Ej: 01, 02 (Prefijo de acceso)
                                            </span>
                                        </div>
                                        <Input
                                            id="codigo_numeral"
                                            value={data.codigo_numeral}
                                            onChange={(e) => setData('codigo_numeral', e.target.value)}
                                            placeholder="01"
                                            maxLength={2}
                                            className="text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400"
                                        />
                                        {errors.codigo_numeral && (
                                            <p className="text-red-500 text-xs mt-1">{errors.codigo_numeral}</p>
                                        )}
                                    </div>

                                    {/* Fila 2, Col 2: Teléfono (alineado en la misma fila que Numeral Planta) */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="telefono">{__('Phone')}</Label>
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={data.pais_telefono_id}
                                            phoneValue={data.telefono || ''}
                                            onPaisChange={(v) => setData('pais_telefono_id', v)}
                                            onPhoneChange={(v) => setData('telefono', v)}
                                            placeholder="55 5899 1200"
                                            error={errors.telefono}
                                        />
                                    </div>

                                    {/* Fila 3, Col 1: Zona Horaria Asignada (solo lectura con acceso a pestaña Ubicación) */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="zona_horaria_preview" className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                                {__('Time Zone')}
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('ubicacion')}
                                                className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-medium cursor-pointer"
                                            >
                                                Cambiar en Ubicación →
                                            </button>
                                        </div>
                                        <Input
                                            id="zona_horaria_preview"
                                            readOnly
                                            value={data.zona_horaria || 'America/Mexico_City'}
                                            className="font-mono text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 cursor-default focus-visible:ring-0"
                                        />
                                    </div>

                                    {/* Fila 3, Col 2: Estado Operativo (Tarjeta estilizada) */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status">{__('Status')}</Label>
                                        <div className="h-9 px-3.5 rounded-md border border-input bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {data.status ? 'Sucursal Activa y Operando' : 'Sucursal Inactiva'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id="status"
                                                    checked={data.status}
                                                    onCheckedChange={(checked) => setData('status', checked)}
                                                />
                                                <span className={cn(
                                                    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                                                    data.status
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                )}>
                                                    {data.status ? __('Active') : __('Inactive')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Ubicación ══════════════════════════════════════════════════ */}
                            <TabsContent value="ubicacion" className="space-y-4">
                                {/* Dirección con botones de geocodificación y ubicación actual en la barra superior */}
                                <div className="space-y-1.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <Label htmlFor="direccion" className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                            {__('Address')}
                                        </Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleGetCurrentLocation}
                                                disabled={locatingCurrent}
                                                className="h-7 text-xs px-2.5 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                                            >
                                                {locatingCurrent ? (
                                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-violet-600" />
                                                ) : (
                                                    <LocateFixed className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                                                )}
                                                {locatingCurrent ? 'Obteniendo GPS...' : 'Usar mi ubicación actual'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleForceGeocode}
                                                disabled={geocoding}
                                                className="h-7 text-xs px-2.5"
                                            >
                                                <MapPin className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
                                                {geocoding ? __('Locating...') : __('Locate address on map')}
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        id="direccion"
                                        value={data.direccion || ''}
                                        onChange={(e) => setData('direccion', e.target.value)}
                                        placeholder={__('Street and number, or click on the map...')}
                                        rows={2}
                                        className="text-sm resize-none"
                                    />
                                    {errors.direccion && (
                                        <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
                                    )}
                                </div>

                                {/* Coordenadas y Zona Horaria Automática en proporción 3 / 3 / 6 */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3 space-y-1.5">
                                        <Label htmlFor="latitud">{__('Latitude')}</Label>
                                        <Input
                                            id="latitud"
                                            type="number"
                                            step="any"
                                            value={data.latitud ?? ''}
                                            onChange={async (e) => {
                                                coordsSourceRef.current = 'manual';
                                                const newLat = e.target.value ? parseFloat(e.target.value) : null;
                                                setData('latitud', newLat);
                                                if (newLat !== null && data.longitud !== null) {
                                                    const tz = await getTimezoneFromCoords(newLat, data.longitud);
                                                    if (tz) setData((prev) => ({ ...prev, latitud: newLat, zona_horaria: tz }));
                                                }
                                            }}
                                            placeholder="19.5512"
                                            className="font-mono text-xs"
                                        />
                                        {errors.latitud && <p className="text-red-500 text-xs mt-1">{errors.latitud}</p>}
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <Label htmlFor="longitud">{__('Longitude')}</Label>
                                        <Input
                                            id="longitud"
                                            type="number"
                                            step="any"
                                            value={data.longitud ?? ''}
                                            onChange={async (e) => {
                                                coordsSourceRef.current = 'manual';
                                                const newLng = e.target.value ? parseFloat(e.target.value) : null;
                                                setData('longitud', newLng);
                                                if (data.latitud !== null && newLng !== null) {
                                                    const tz = await getTimezoneFromCoords(data.latitud, newLng);
                                                    if (tz) setData((prev) => ({ ...prev, longitud: newLng, zona_horaria: tz }));
                                                }
                                            }}
                                            placeholder="-99.0485"
                                            className="font-mono text-xs"
                                        />
                                        {errors.longitud && (
                                            <p className="text-red-500 text-xs mt-1">{errors.longitud}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-6 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="zona_horaria" className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                {__('Time Zone')}
                                            </Label>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                Detectada automáticamente por mapa
                                            </span>
                                        </div>
                                        <Input
                                            id="zona_horaria"
                                            type="text"
                                            readOnly
                                            value={data.zona_horaria || ''}
                                            placeholder="Haz clic en el mapa o usa tu ubicación actual..."
                                            className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 cursor-default focus-visible:ring-0"
                                        />
                                        {errors.zona_horaria && (
                                            <p className="text-red-500 text-xs mt-1">{errors.zona_horaria}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Mapa Leaflet + CartoDB (Claro por defecto + Selector de Estilo) */}
                                <div
                                    style={{ height: '380px', width: '100%' }}
                                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center bg-slate-100 dark:bg-slate-800"
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
                                                markerPosition={
                                                    data.latitud && data.longitud
                                                        ? [data.latitud, data.longitud]
                                                        : null
                                                }
                                                onLocationSelected={handleLocationSelected}
                                            />
                                        )}
                                    </Suspense>
                                </div>

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>
                                        Haz clic en el mapa o arrastra el marcador para ajustar la ubicación exacta; la dirección y la zona horaria se actualizarán automáticamente. Puedes cambiar el estilo visual en la esquina superior derecha del mapa.
                                    </span>
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
