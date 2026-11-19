import { Head, useForm, router } from '@inertiajs/react';
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
    Clock,
    Loader2,
    Search,
    Compass,
    Check,
    FileText,
    UserCheck,
    Globe,
    Sparkles,
} from 'lucide-react';
import React, { useState, Suspense, lazy, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useLocationGeocoding } from '@/hooks/use-location-geocoding';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
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
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import PhoneInputGroup from './Partials/PhoneInputGroup';

const EmpresaMapComponent = lazy(() => {
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
    nombre_comercial?: string | null;
    documento: string;
    logo?: string | null;
    logo_mini?: string | null;
    direccion?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    representante_legal?: string | null;
    curp_representante_legal?: string | null;
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
    nombre_comercial: '',
    documento: '',
    representante_legal: '',
    curp_representante_legal: '',
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
    zona_horaria: '',
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

        return () => {
 unbindStart(); unbindFinish(); 
};
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
    const pageProps = usePage().props as any;
    const mapboxApiKey = pageProps.mapbox_api_key || pageProps.auth?.user?.empresa?.mapbox_api_key;
    const { forwardGeocode, isGeocoding } = useLocationGeocoding({
        mapboxApiKey,
        debounceMs: 700,
    });

    const { data, setData, post, put, processing, errors, reset, transform } = useForm(initialForm);

    // Saneamiento de payload para persistencia atómica
    React.useEffect(() => {
        transform((raw: Record<string, any>) => ({
            ...raw,
            latitud: raw.latitud !== null && raw.latitud !== undefined && (raw.latitud as any) !== '' && !isNaN(Number(raw.latitud))
                ? Number(raw.latitud)
                : null,
            longitud: raw.longitud !== null && raw.longitud !== undefined && (raw.longitud as any) !== '' && !isNaN(Number(raw.longitud))
                ? Number(raw.longitud)
                : null,
        }));
    }, [transform]);

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
            razon_social:             empresa.razon_social || '',
            nombre_comercial:         empresa.nombre_comercial || '',
            documento:                empresa.documento || '',
            representante_legal:      empresa.representante_legal || '',
            curp_representante_legal: empresa.curp_representante_legal || '',
            status:                   empresa.status,
            pais_telefono_id:         empresa.pais_id ?? '',
            telefono:                 empresa.telefono || '',
            email:                    empresa.email || '',
            pais_id:                  empresa.pais_id ?? '',
            direccion:                empresa.direccion || '',
            latitud:                  empresa.latitud ?? null,
            longitud:                 empresa.longitud ?? null,
            zona_horaria:             (empresa as any).zona_horaria || '',
        });
        setLogoFile(null);
        setLogoMiniFile(null);
        setLogoPreview(empresa.logo || null);
        setLogoMiniPreview(empresa.logo_mini || null);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleLogoFileChange = (file: File | null, type: 'logo' | 'logo_mini') => {
        if (!file) {
return;
}

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
        if (!editingEmpresa) {
return;
}

        if (!logoFile && !logoMiniFile) {
return;
}

        const formData = new FormData();

        if (logoFile)     {
formData.append('logo',      logoFile);
}

        if (logoMiniFile) {
formData.append('logo_mini', logoMiniFile);
}

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
                onSuccess: (page) => {
                    const flashNotif = (page.props as any).notification;
                    if (flashNotif && flashNotif.type === 'error') {
                        notifyError(flashNotif.message || __('There was an error updating the company. Please try again.'));
                        return;
                    }
                    setIsModalOpen(false);
                    setEditingEmpresa(null);
                    reset();
                    notifySuccess(__('Company updated successfully.'));
                },
                onError: (formErrors) => {
                    const firstError = formErrors.general || formErrors.error || Object.values(formErrors)[0];
                    notifyError(typeof firstError === 'string' ? firstError : __('Please review the highlighted fields.'));
                },
            });
        } else {
            post('/admin/empresas', {
                onSuccess: (page) => {
                    const flashNotif = (page.props as any).notification;
                    if (flashNotif && flashNotif.type === 'error') {
                        notifyError(flashNotif.message || __('There was an error creating the company. Please try again.'));
                        return;
                    }
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Company created successfully.'));
                },
                onError: (formErrors) => {
                    const firstError = formErrors.general || formErrors.error || Object.values(formErrors)[0];
                    notifyError(typeof firstError === 'string' ? firstError : __('Please review the highlighted fields.'));
                },
            });
        }
    };

    const handleToggleStatus = (empresa: Empresa) => {
        router.patch(`/admin/empresas/${empresa.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleAddressChange = (newAddress: string) => {
        setData('direccion', newAddress);

        if (newAddress.trim().length >= 4) {
            forwardGeocode({
                direccion: newAddress,
                pais: paisSeleccionado?.nombre,
            }).then((result) => {
                if (result) {
                    setData((prev) => ({
                        ...prev,
                        latitud: result.lat,
                        longitud: result.lng,
                        ...(result.zona_horaria && !prev.zona_horaria ? { zona_horaria: result.zona_horaria } : {}),
                    }));
                }
            });
        }
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string, timezone?: string) => {
        setData((prev) => ({
            ...prev,
            latitud:  lat,
            longitud: lng,
            ...(address && !prev.direccion ? { direccion: address } : {}),
            ...(timezone ? { zona_horaria: timezone } : {}),
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
            header: __('Time Zone'),
            hideOn: 'mobile',
            cell: (empresa) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{(empresa as any).zona_horaria || __('Default')}</span>
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

            {/* ── Modal de Creación / Edición Modernizado ───────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[780px] lg:max-w-[1020px] p-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 max-h-[92vh] flex flex-col">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
                            {/* Header Moderno con Gradiente y Badges */}
                            <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-transparent flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                    {editingEmpresa ? __('Edit Company') : __('New Company')}
                                                </DialogTitle>
                                                {editingEmpresa && (
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                                            data.status
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                        )}
                                                    >
                                                        <span className={cn('w-1.5 h-1.5 rounded-full', data.status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                                                        {data.status ? __('Active') : __('Inactive')}
                                                    </span>
                                                )}
                                            </div>
                                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {editingEmpresa
                                                    ? __('Update corporate details, tax identification, Leaflet GPS, and branding.')
                                                    : __('Register a new corporate entity in the database with location mapping.')}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs Segmentados Modernos y Ajustados */}
                                <div className="mt-5">
                                    <TabsList className={cn(
                                        'grid w-full h-11 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800',
                                        editingEmpresa ? 'grid-cols-3' : 'grid-cols-2'
                                    )}>
                                        <TabsTrigger
                                            value="general"
                                            className="h-full rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all select-none"
                                        >
                                            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            {__('General Info')}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="ubicacion"
                                            className="h-full rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all select-none"
                                        >
                                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            {__('Location & Map')}
                                            {data.latitud && data.longitud && (
                                                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-1" />
                                            )}
                                        </TabsTrigger>
                                        {editingEmpresa && (
                                            <TabsTrigger
                                                value="logos"
                                                className="h-full rounded-lg flex items-center justify-center gap-2 font-medium text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all select-none"
                                            >
                                                <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                {__('Logos & Branding')}
                                                {(logoFile || logoMiniFile) && (
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block ml-1" />
                                                )}
                                            </TabsTrigger>
                                        )}
                                    </TabsList>
                                </div>
                            </div>

                            {/* Modal Body Scrolleable */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                                {/* ══ Tab 1: General ══════════════════════════════════════════════════ */}
                                <TabsContent value="general" className="mt-0 space-y-5">
                                    {/* 1. Identidad Fiscal & Comercial */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                {__('Fiscal & Commercial Identity')}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Razón social */}
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label htmlFor="razon_social" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Company Name')} <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="razon_social"
                                                    value={data.razon_social}
                                                    onChange={(e) => setData('razon_social', e.target.value)}
                                                    placeholder="Ej: Smurfit Westrock México S.A. de C.V."
                                                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.razon_social && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.razon_social}</p>
                                                )}
                                            </div>

                                            {/* Nombre comercial */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="nombre_comercial" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Trade Name')}
                                                </Label>
                                                <Input
                                                    id="nombre_comercial"
                                                    value={data.nombre_comercial || ''}
                                                    onChange={(e) => setData('nombre_comercial', e.target.value)}
                                                    placeholder="Ej: Smurfit Westrock"
                                                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.nombre_comercial && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.nombre_comercial}</p>
                                                )}
                                            </div>

                                            {/* RFC / Documento */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="documento" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Registro federal de contribuyentes (RFC)')} <span className="text-rose-500">*</span>
                                                </Label>
                                                <Input
                                                    id="documento"
                                                    value={data.documento}
                                                    onChange={(e) => setData('documento', e.target.value)}
                                                    placeholder="RFC123456ABC"
                                                    className="h-11 rounded-xl uppercase font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.documento && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.documento}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Representación Legal */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                {__('Legal Representation')}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Representante legal */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="representante_legal" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Legal Representative')}
                                                </Label>
                                                <Input
                                                    id="representante_legal"
                                                    value={data.representante_legal || ''}
                                                    onChange={(e) => setData('representante_legal', e.target.value)}
                                                    placeholder="Nombre y apellidos"
                                                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.representante_legal && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.representante_legal}</p>
                                                )}
                                            </div>

                                            {/* CURP */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="curp_representante_legal" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Curp del representante legal')}
                                                </Label>
                                                <Input
                                                    id="curp_representante_legal"
                                                    value={data.curp_representante_legal || ''}
                                                    onChange={(e) => setData('curp_representante_legal', e.target.value)}
                                                    placeholder="CURP (18 caracteres)"
                                                    maxLength={18}
                                                    className="h-11 rounded-xl uppercase font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                />
                                                {errors.curp_representante_legal && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.curp_representante_legal}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Contacto & Estado */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                {__('Contact & Organization Status')}
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Teléfono */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="telefono" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Phone')}
                                                </Label>
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

                                            {/* Correo electrónico */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {__('Email')}
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={data.email || ''}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="contacto@empresa.com"
                                                        className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pl-10"
                                                    />
                                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                                </div>
                                                {errors.email && (
                                                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email}</p>
                                                )}
                                            </div>

                                            {/* Status Switch Box */}
                                            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="status" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                                                        {__('Company Operational Status')}
                                                    </Label>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {data.status
                                                            ? __('Company is active. Branches, kiosks, and employees can operate normally.')
                                                            : __('Company is inactive. Access and operational services are disabled.')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'text-xs font-bold px-2.5 py-1 rounded-full',
                                                            data.status
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {data.status ? __('Active') : __('Inactive')}
                                                    </span>
                                                    <Switch
                                                        id="status"
                                                        checked={data.status}
                                                        onCheckedChange={(checked) => setData('status', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ══ Tab 2: Ubicación & Leaflet JS ══════════════════════════════════ */}
                                <TabsContent value="ubicacion" className="mt-0 space-y-5">
                                    {/* Selector de País y Dirección */}
                                    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="pais_id" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                    {__('Country')}
                                                </Label>
                                                <Select
                                                    value={String(data.pais_id)}
                                                    onValueChange={(v) => {
                                                        setData({
                                                            ...data,
                                                            pais_id: v,
                                                            latitud: null,
                                                            longitud: null,
                                                            direccion: '',
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger id="pais_id" className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                                                        <SelectValue placeholder={__('Select a country')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-xl max-h-60">
                                                        <SelectItem value="">{__('None')}</SelectItem>
                                                        {paises.map((pais) => (
                                                            <SelectItem key={pais.id} value={String(pais.id)} className="rounded-lg">
                                                                {pais.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.pais_id && (
                                                    <p className="text-rose-500 text-xs font-medium">{errors.pais_id}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 sm:col-span-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="direccion" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                        {__('Address & Headquarters')}
                                                    </Label>
                                                    {isGeocoding && (
                                                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            {__('Locating...')}
                                                        </span>
                                                    )}
                                                </div>
                                                <Textarea
                                                    id="direccion"
                                                    value={data.direccion || ''}
                                                    onChange={(e) => handleAddressChange(e.target.value)}
                                                    placeholder={__('Type an address or click directly on the map to pin headquarters...')}
                                                    rows={1}
                                                    className="h-11 min-h-[44px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none text-xs sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visor Leaflet JS Moderno */}
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900">
                                        <div style={{ height: '400px', width: '100%' }}>
                                            <Suspense
                                                fallback={
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 text-slate-400">
                                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                                        <p className="text-xs font-medium">{__('Loading Leaflet Map...')}</p>
                                                    </div>
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
                                    </div>

                                    {/* Coordenadas & Zona Horaria */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="latitud" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                {__('Latitude')}
                                            </Label>
                                            <Input
                                                id="latitud"
                                                type="number"
                                                step="any"
                                                value={data.latitud ?? ''}
                                                onChange={(e) =>
                                                    setData('latitud', e.target.value ? parseFloat(e.target.value) : null)
                                                }
                                                placeholder="19.92"
                                                className="h-9 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="longitud" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                {__('Longitude')}
                                            </Label>
                                            <Input
                                                id="longitud"
                                                type="number"
                                                step="any"
                                                value={data.longitud ?? ''}
                                                onChange={(e) =>
                                                    setData('longitud', e.target.value ? parseFloat(e.target.value) : null)
                                                }
                                                placeholder="-102.01"
                                                className="h-9 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-1.5 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                                            <Label htmlFor="zona_horaria" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                {__('Time Zone (Auto)')}
                                            </Label>
                                            <Input
                                                id="zona_horaria"
                                                value={data.zona_horaria || ''}
                                                onChange={(e) => setData('zona_horaria', e.target.value)}
                                                placeholder="America/Mexico_City"
                                                className="h-9 rounded-lg font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            />
                                            {errors.zona_horaria && (
                                                <p className="text-rose-500 text-[11px] font-medium">{errors.zona_horaria}</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* ══ Tab 3: Logos ═══════════════════════════════════════════════════════ */}
                                {editingEmpresa && (
                                    <TabsContent value="logos" className="mt-0 space-y-5">
                                        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {__('Upload corporate logos. The main logo is used in reports, kiosk navbar, and official documents. The mini logo is used in small badges and avatar containers.')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Logo principal */}
                                            <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <ImageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                        {__('Main Logo')}
                                                    </Label>
                                                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP · max 5MB</span>
                                                </div>

                                                <div
                                                    onClick={() => logoInputRef.current?.click()}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const file = e.dataTransfer.files[0];
                                                        if (file) handleLogoFileChange(file, 'logo');
                                                    }}
                                                    className="relative group cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 flex items-center justify-center min-h-[170px]"
                                                >
                                                    {logoPreview ? (
                                                        <>
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo principal"
                                                                className="w-full h-36 object-contain p-3"
                                                            />
                                                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="text-white text-center">
                                                                    <Upload className="h-5 w-5 mx-auto mb-1" />
                                                                    <p className="text-xs font-semibold">{__('Click to change')}</p>
                                                                </div>
                                                            </div>
                                                            {logoFile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLogoFile(null);
                                                                        setLogoPreview(editingEmpresa?.logo || null);
                                                                    }}
                                                                    className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-md hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-500 transition-colors"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                                                <ImageIcon className="h-6 w-6 text-indigo-500" />
                                                            </div>
                                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{__('Click or drag to upload')}</p>
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
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 pt-1">
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        {logoFile.name} ({(logoFile.size / 1024).toFixed(0)} KB)
                                                    </p>
                                                )}
                                            </div>

                                            {/* Logo mini (favicon) */}
                                            <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                        {__('Mini Logo (Favicon)')}
                                                    </Label>
                                                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP · max 2MB</span>
                                                </div>

                                                <div
                                                    onClick={() => logoMiniInputRef.current?.click()}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const file = e.dataTransfer.files[0];
                                                        if (file) handleLogoFileChange(file, 'logo_mini');
                                                    }}
                                                    className="relative group cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/60 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 flex items-center justify-center min-h-[170px]"
                                                >
                                                    {logoMiniPreview ? (
                                                        <>
                                                            <img
                                                                src={logoMiniPreview}
                                                                alt="Logo mini"
                                                                className="w-full h-36 object-contain p-3"
                                                            />
                                                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="text-white text-center">
                                                                    <Upload className="h-5 w-5 mx-auto mb-1" />
                                                                    <p className="text-xs font-semibold">{__('Click to change')}</p>
                                                                </div>
                                                            </div>
                                                            {logoMiniFile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLogoMiniFile(null);
                                                                        setLogoMiniPreview(editingEmpresa?.logo_mini || null);
                                                                    }}
                                                                    className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-md hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-500 transition-colors"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                                                            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
                                                                <ImageIcon className="h-6 w-6 text-purple-500" />
                                                            </div>
                                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{__('Click or drag to upload')}</p>
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
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1.5 pt-1">
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        {logoMiniFile.name} ({(logoMiniFile.size / 1024).toFixed(0)} KB)
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botón de subida de logos */}
                                        <div className="flex justify-end pt-3 border-t border-slate-200/80 dark:border-slate-800">
                                            <Button
                                                type="button"
                                                onClick={handleUploadLogos}
                                                disabled={uploadingLogos || (!logoFile && !logoMiniFile)}
                                                className="rounded-xl px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/25 flex items-center gap-2"
                                            >
                                                {uploadingLogos ? (
                                                    <>
                                                        <Loader2 className="animate-spin h-4 w-4" />
                                                        {__('Uploading...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4" />
                                                        {__('Upload Selected Logos')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </TabsContent>
                                )}
                            </div>

                            {/* Footer Moderno con Botones de Acción */}
                            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between">
                                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    <span>{__('All required fields must be filled before saving')}</span>
                                </div>
                                <div className="flex items-center gap-2.5 ml-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={processing}
                                        className="rounded-xl px-5 h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs sm:text-sm"
                                    >
                                        {__('Cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-xl px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{__('Saving...')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{editingEmpresa ? __('Save Changes') : __('Create Company')}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Tabs>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
