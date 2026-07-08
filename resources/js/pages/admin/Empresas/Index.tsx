import React, { useState, Suspense, lazy, useRef } from 'react';
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
import { notifySuccess, notifyError } from '@/utils/notifications';
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
    ImageIcon,
    Upload,
    X,
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

    // Logos
    const [logoFile, setLogoFile]           = useState<File | null>(null);
    const [logoMiniFile, setLogoMiniFile]   = useState<File | null>(null);
    const [logoPreview, setLogoPreview]     = useState<string | null>(null);
    const [logoMiniPreview, setLogoMiniPreview] = useState<string | null>(null);
    const [uploadingLogos, setUploadingLogos]   = useState(false);
    const logoInputRef     = useRef<HTMLInputElement>(null);
    const logoMiniInputRef = useRef<HTMLInputElement>(null);

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
        setLogoFile(null);
        setLogoMiniFile(null);
        setLogoPreview(null);
        setLogoMiniPreview(null);
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
        setLogoFile(null);
        setLogoMiniFile(null);
        setLogoPreview(empresa.logo || null);
        setLogoMiniPreview(empresa.logo_mini || null);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleLogoFileChange = (file: File | null, type: 'logo' | 'logo_mini') => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(reader.result as string);
            } else {
                setLogoMiniFile(file);
                setLogoMiniPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUploadLogos = () => {
        if (!editingEmpresa) return;
        if (!logoFile && !logoMiniFile) return;

        const formData = new FormData();
        if (logoFile)     formData.append('logo',      logoFile);
        if (logoMiniFile) formData.append('logo_mini', logoMiniFile);

        setUploadingLogos(true);
        router.post(`/admin/empresas/${editingEmpresa.id}/logos`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setLogoFile(null);
                setLogoMiniFile(null);
                notifySuccess(__('Logos updated successfully.'));
            },
            onError: (errors) => {
                console.error('[Logo Upload] Validation errors:', errors);
                // Mostrar el primer error de validación recibido del servidor
                const firstError = Object.values(errors)[0] as string | undefined;
                notifyError(firstError ?? __('There was an error updating the logos. Please try again.'));
            },
            onFinish: () => setUploadingLogos(false),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmpresa) {
            put(`/admin/empresas/${editingEmpresa.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingEmpresa(null);
                    reset();
                    notifySuccess(__('Company updated successfully.'));
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        } else {
            post('/admin/empresas', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Company created successfully.'));
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
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
                            <TabsList className={`grid w-full mb-6 ${editingEmpresa ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                                {editingEmpresa && (
                                    <TabsTrigger value="logos" className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        {__('Logos')}
                                    </TabsTrigger>
                                )}
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
                            {/* ══ Tab 4: Logos ═══════════════════════════════════════════════════════ */}
                            {editingEmpresa && (
                                <TabsContent value="logos" className="space-y-6">
                                    <p className="text-sm text-muted-foreground">
                                        {__('Upload the company logos. The main logo is used in reports and documents. The mini logo (favicon) is used in the browser tab and small display areas.')}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Logo principal */}
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4 text-indigo-500" />
                                                {__('Main Logo')}
                                                <span className="text-xs text-muted-foreground ml-1">({__('Reports & Documents')})</span>
                                            </Label>

                                            {/* Preview / Drop zone */}
                                            <div
                                                onClick={() => logoInputRef.current?.click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];
                                                    if (file) handleLogoFileChange(file, 'logo');
                                                }}
                                                className="relative group cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                                                style={{ minHeight: '180px' }}
                                            >
                                                {logoPreview ? (
                                                    <>
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo principal"
                                                            className="w-full h-44 object-contain p-4"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="text-white text-center">
                                                                <Upload className="h-6 w-6 mx-auto mb-1" />
                                                                <p className="text-xs">{__('Click to change')}</p>
                                                            </div>
                                                        </div>
                                                        {logoFile && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(editingEmpresa?.logo || null); }}
                                                                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                                                        <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                            <ImageIcon className="h-7 w-7 text-indigo-400" />
                                                        </div>
                                                        <p className="text-xs font-medium">{__('Click or drag to upload')}</p>
                                                        <p className="text-xs text-slate-300">PNG, JPG, WEBP · max 5MB</p>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null, 'logo')}
                                            />

                                            {logoFile && (
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                                                    <Upload className="h-3 w-3" />
                                                    {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
                                                </p>
                                            )}
                                        </div>

                                        {/* Logo mini (favicon) */}
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4 text-purple-500" />
                                                {__('Mini Logo')}
                                                <span className="text-xs text-muted-foreground ml-1">({__('Favicon & small areas')})</span>
                                            </Label>

                                            <div
                                                onClick={() => logoMiniInputRef.current?.click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];
                                                    if (file) handleLogoFileChange(file, 'logo_mini');
                                                }}
                                                className="relative group cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
                                                style={{ minHeight: '180px' }}
                                            >
                                                {logoMiniPreview ? (
                                                    <>
                                                        <img
                                                            src={logoMiniPreview}
                                                            alt="Logo mini"
                                                            className="w-full h-44 object-contain p-4"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="text-white text-center">
                                                                <Upload className="h-6 w-6 mx-auto mb-1" />
                                                                <p className="text-xs">{__('Click to change')}</p>
                                                            </div>
                                                        </div>
                                                        {logoMiniFile && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setLogoMiniFile(null); setLogoMiniPreview(editingEmpresa?.logo_mini || null); }}
                                                                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                                                        <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <ImageIcon className="h-7 w-7 text-purple-400" />
                                                        </div>
                                                        <p className="text-xs font-medium">{__('Click or drag to upload')}</p>
                                                        <p className="text-xs text-slate-300">PNG, JPG, WEBP · max 2MB</p>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                ref={logoMiniInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null, 'logo_mini')}
                                            />

                                            {logoMiniFile && (
                                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                                                    <Upload className="h-3 w-3" />
                                                    {logoMiniFile.name} ({(logoMiniFile.size / 1024).toFixed(0)} KB)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón de subida de logos */}
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button
                                            type="button"
                                            onClick={handleUploadLogos}
                                            disabled={uploadingLogos || (!logoFile && !logoMiniFile)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {uploadingLogos ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {__('Uploading...')}
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {__('Upload Logos')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </TabsContent>
                            )}

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
