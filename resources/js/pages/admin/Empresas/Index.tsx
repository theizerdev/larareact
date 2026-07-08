import React, { useState, Suspense, lazy } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import type { Auth } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import { Paginated } from '@/types/app';
import { DataTable, ColumnDef } from '@/components/data-table';
import { cn, cleanParams } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Building2,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    ToggleRight,
    Phone,
    Mail,
    MapPin,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PhoneInputGroup from './Partials/PhoneInputGroup';

// Carga diferida del mapa (SSR-safe)
const EmpresaMapComponent = lazy(() => {
    if (typeof window !== 'undefined') {
        import('leaflet/dist/leaflet.css');
    }
    return import('./Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
    pais_id?: number | null;
    razon_social: string;
    documento: string;
    logo?: string | null;
    logo_mini?: string | null;
    direccion?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    representante_legal?: string | null;
    telefono?: string | null;
    email?: string | null;
    status: boolean;
    pais?: Pais | null;
}

interface EmpresasPageProps {
    auth: Auth;
    empresas: Paginated<Empresa>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    razon_social: '',
    documento: '',
    representante_legal: '',
    status: true as boolean,
    // Contacto
    pais_telefono_id: '' as string | number,  // UI only — selector de bandera/prefijo
    telefono: '',
    email: '',
    // Ubicación
    pais_id: '' as string | number,
    direccion: '',
    latitud: null as number | null,
    longitud: null as number | null,
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EmpresasIndexPage({ auth, empresas, stats, paises, filters }: EmpresasPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Companies'), href: '/admin/empresas' },
    ];

    // ── Estados ──────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [editingEmpresa, setEditingEmpresa]   = useState<Empresa | null>(null);
    const [activeTab, setActiveTab]             = useState('general');
    const [isTableLoading, setIsTableLoading]   = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]       = useState(filters.search || '');
    const [statusFilter, setStatusFilter]   = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // ── Hooks de navegación ───────────────────────────────────────────────────
    React.useEffect(() => {
        const unbindStart  = router.on('start',  () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));
        return () => { unbindStart(); unbindFinish(); };
    }, []);

    // Debounce de filtros
    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({ search: searchTerm, status: statusFilter, perPage: perPageFilter }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter]);

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Mapa: centro calculado según pais_id seleccionado ────────────────────
    const paisSeleccionado = paises.find((p) => p.id === Number(data.pais_id));
    const mapCenter: [number, number] =
        data.latitud && data.longitud
            ? [data.latitud, data.longitud]
            : paisSeleccionado?.latitud && paisSeleccionado?.longitud
            ? [paisSeleccionado.latitud, paisSeleccionado.longitud]
            : [4.6, -74.1]; // Bogotá como fallback

    const mapZoom = data.latitud && data.longitud ? 14 : paisSeleccionado ? 6 : 4;

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingEmpresa(null);
        reset();
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (empresa: Empresa) => {
        setEditingEmpresa(empresa);
        setData({
            razon_social:        empresa.razon_social || '',
            documento:           empresa.documento || '',
            representante_legal: empresa.representante_legal || '',
            status:              empresa.status,
            pais_telefono_id:    empresa.pais_id ?? '',
            telefono:            empresa.telefono || '',
            email:               empresa.email || '',
            pais_id:             empresa.pais_id ?? '',
            direccion:           empresa.direccion || '',
            latitud:             empresa.latitud ?? null,
            longitud:            empresa.longitud ?? null,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmpresa) {
            put(`/admin/empresas/${editingEmpresa.id}`, {
                onSuccess: () => { setIsModalOpen(false); setEditingEmpresa(null); reset(); },
            });
        } else {
            post('/admin/empresas', {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        }
    };

    const handleToggleStatus = (empresa: Empresa) => {
        router.patch(`/admin/empresas/${empresa.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string) => {
        setData((prev) => ({
            ...prev,
            latitud:  lat,
            longitud: lng,
            ...(address ? { direccion: address } : {}),
        }));
    };

    // ── Columnas de la tabla ──────────────────────────────────────────────────

    const columns: ColumnDef<Empresa>[] = [
        {
            header: 'Company',
            accessorKey: 'razon_social',
            className: 'font-medium',
            cell: (empresa) => (
                <div className="flex items-center gap-3">
                    {empresa.logo_mini || empresa.logo ? (
                        <img
                            src={empresa.logo_mini || empresa.logo || ''}
                            alt={empresa.razon_social}
                            className="w-8 h-8 rounded object-cover border"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-sm">{empresa.razon_social}</p>
                        <p className="text-xs text-muted-foreground">{empresa.documento}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Country',
            accessorKey: 'pais',
            hideOn: 'mobile',
            cell: (empresa) => (
                <span className="text-sm text-muted-foreground">
                    {empresa.pais?.nombre ?? '—'}
                </span>
            ),
        },
        {
            header: 'Contact',
            hideOn: 'mobile',
            cell: (empresa) => (
                <div className="space-y-0.5">
                    {empresa.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {empresa.telefono}
                        </div>
                    )}
                    {empresa.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {empresa.email}
                        </div>
                    )}
                    {!empresa.telefono && !empresa.email && <span className="text-xs text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (empresa) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={empresa.status}
                        onCheckedChange={() => handleToggleStatus(empresa)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        empresa.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {empresa.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (empresa) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(empresa)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(empresa)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {empresa.status ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title={__('Companies')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Building2 className="h-6 w-6 text-white" />}
                    title={__('Companies')}
                    description={__('Manage companies, their locations and contact information.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Company')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Building2 className="h-6 w-6" />}
                        title={__('TOTAL COMPANIES')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
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
                                placeholder={__('Search by name, document, email...')}
                                className="w-full md:w-96"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Status')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
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
                        data={empresas}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(empresa) => handleEditClick(empresa)}
                        emptyState={{
                            title: 'No companies found',
                            description: searchTerm || statusFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any companies in the database yet.',
                            ctaLabel: 'New Company',
                            onCtaClick: handleCreateClick,
                        }}
                    />
                </div>
            </div>

            {/* ── Modal de Creación / Edición ───────────────────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingEmpresa ? __('Edit Company') : __('New Company')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Complete the company information across the available sections.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                            {/* ── Navbar de tabs ── */}
                            <TabsList className="grid grid-cols-3 w-full mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    {__('General')}
                                </TabsTrigger>
                                <TabsTrigger value="contacto" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {__('Contact')}
                                </TabsTrigger>
                                <TabsTrigger value="ubicacion" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {__('Location')}
                                </TabsTrigger>
                            </TabsList>

                            {/* ══ Tab 1: Información General ══════════════════════════════════════ */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Razón Social */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="razon_social">{__('Company Name')} *</Label>
                                        <Input
                                            id="razon_social"
                                            value={data.razon_social}
                                            onChange={(e) => setData('razon_social', e.target.value)}
                                            placeholder="Ej: Empresa S.A. de C.V."
                                        />
                                        {errors.razon_social && (
                                            <p className="text-red-500 text-xs mt-1">{errors.razon_social}</p>
                                        )}
                                    </div>

                                    {/* Documento */}
                                    <div>
                                        <Label htmlFor="documento">{__('Document / Tax ID')} *</Label>
                                        <Input
                                            id="documento"
                                            value={data.documento}
                                            onChange={(e) => setData('documento', e.target.value)}
                                            placeholder="RIF, NIT, RFC..."
                                        />
                                        {errors.documento && (
                                            <p className="text-red-500 text-xs mt-1">{errors.documento}</p>
                                        )}
                                    </div>

                                    {/* Representante Legal */}
                                    <div>
                                        <Label htmlFor="representante_legal">{__('Legal Representative')}</Label>
                                        <Input
                                            id="representante_legal"
                                            value={data.representante_legal || ''}
                                            onChange={(e) => setData('representante_legal', e.target.value)}
                                            placeholder="Nombre completo"
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

                            {/* ══ Tab 2: Contacto ══════════════════════════════════════════════════ */}
                            <TabsContent value="contacto" className="space-y-4">
                                {/* Teléfono unificado: [🏴 +58] [número] */}
                                <div>
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

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email">{__('Email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email || ''}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="correo@empresa.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ══ Tab 3: Ubicación ══════════════════════════════════════════════════ */}
                            <TabsContent value="ubicacion" className="space-y-4">
                                {/* País de la empresa */}
                                <div>
                                    <Label htmlFor="pais_id">{__('Country')}</Label>
                                    <Select
                                        value={String(data.pais_id)}
                                        onValueChange={(v) => {
                                            // Si cambia el país, limpiar coordenadas para centrar el mapa en él
                                            setData({
                                                ...data,
                                                pais_id:  v,
                                                latitud:  null,
                                                longitud: null,
                                                direccion: '',
                                            });
                                        }}
                                    >
                                        <SelectTrigger id="pais_id">
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
                                    {errors.pais_id && (
                                        <p className="text-red-500 text-xs mt-1">{errors.pais_id}</p>
                                    )}
                                </div>

                                {/* Coordenadas manuales */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="latitud">{__('Latitude')}</Label>
                                        <Input
                                            id="latitud"
                                            type="number"
                                            step="any"
                                            value={data.latitud ?? ''}
                                            onChange={(e) =>
                                                setData('latitud', e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                            placeholder="10.48801"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitud">{__('Longitude')}</Label>
                                        <Input
                                            id="longitud"
                                            type="number"
                                            step="any"
                                            value={data.longitud ?? ''}
                                            onChange={(e) =>
                                                setData('longitud', e.target.value ? parseFloat(e.target.value) : null)
                                            }
                                            placeholder="-66.87919"
                                        />
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div>
                                    <Label htmlFor="direccion">{__('Address')}</Label>
                                    <Textarea
                                        id="direccion"
                                        value={data.direccion || ''}
                                        onChange={(e) => setData('direccion', e.target.value)}
                                        placeholder={__('The address will be auto-filled when you click on the map...')}
                                        rows={2}
                                    />
                                </div>

                                {/* Mapa Leaflet */}
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
                                            <EmpresaMapComponent
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
        </>
    );
}
