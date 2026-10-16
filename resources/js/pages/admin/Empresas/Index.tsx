import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Phone,
    Mail,
    MapPin,
    ImageIcon,
    Upload,
    X,
    Clock,
    Users,
    GitBranch,
    Search,
    LayoutGrid,
    List,
    Copy,
    CheckCircle2,
    XCircle,
    Navigation,
    ExternalLink,
    AlertTriangle,
    SlidersHorizontal,
    FileText,
} from 'lucide-react';
import React, { useState, Suspense, lazy, useMemo, useRef } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';
import PhoneInputGroup from './Partials/PhoneInputGroup';

const EmpresaMapComponent = lazy(() => {
    return import('./Partials/MapComponent').then((mod) => ({ default: mod.default }));
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
    pais_id?: number | null;
    pais_telefono_id?: number | string | null;
    razon_social: string;
    nombre_comercial?: string | null;
    documento: string;
    logo?: string | null;
    logo_mini?: string | null;
    direccion?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    zona_horaria?: string | null;
    representante_legal?: string | null;
    curp_representante_legal?: string | null;
    telefono?: string | null;
    email?: string | null;
    status: boolean;
    sucursales_count?: number;
    users_count?: number;
    pais?: Pais | null;
    created_at?: string;
}

interface EmpresasPageProps {
    auth: Auth;
    empresas: Paginated<Empresa>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        con_sucursales?: number;
        con_usuarios?: number;
    };
    paises: Pais[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
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
    pais_telefono_id: '' as string | number,
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

export default function EmpresasIndexPage({ empresas, stats, paises, filters }: EmpresasPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Companies'), href: '/admin/empresas' },
    ];

    // ── Estados de Interfaz ───────────────────────────────────────────────────
    const [viewMode, setViewMode]               = useState<'grid' | 'table'>('table');
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [editingEmpresa, setEditingEmpresa]   = useState<Empresa | null>(null);
    const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null);
    const [activeTab, setActiveTab]             = useState('general');
    const [isTableLoading, setIsTableLoading]   = useState(false);

    // Logos
    const [logoFile, setLogoFile]               = useState<File | null>(null);
    const [logoMiniFile, setLogoMiniFile]       = useState<File | null>(null);
    const [logoPreview, setLogoPreview]         = useState<string | null>(null);
    const [logoMiniPreview, setLogoMiniPreview] = useState<string | null>(null);
    const [uploadingLogos, setUploadingLogos]   = useState(false);
    const logoInputRef                          = useRef<HTMLInputElement>(null);
    const logoMiniInputRef                      = useRef<HTMLInputElement>(null);

    // Filtros
    const [searchTerm, setSearchTerm]       = useState(filters.search || '');
    const [statusFilter, setStatusFilter]   = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    // ── Listeners de navegación de Inertia ────────────────────────────────────
    React.useEffect(() => {
        const unbindStart  = router.on('start',  () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // ── Sincronización debounced de filtros ────────────────────────────────────
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const currentParams = cleanParams({
                search: searchTerm,
                status: statusFilter,
                perPage: perPageFilter,
                sortBy: filters.sortBy,
                sortDir: filters.sortDir,
            });

            const currentSearch = filters.search || '';
            const currentStatus = filters.status || '';
            const currentPerPage = filters.perPage || '10';

            if (
                searchTerm !== currentSearch ||
                statusFilter !== currentStatus ||
                perPageFilter !== currentPerPage
            ) {
                router.get(window.location.pathname, currentParams, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter, filters]);

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Mapa: centro calculado según país seleccionado ─────────────────────────
    const paisSeleccionado = useMemo(() => {
        return paises.find((p) => p.id === Number(data.pais_id));
    }, [paises, data.pais_id]);

    const mapCenter: [number, number] = useMemo(() => {
        if (data.latitud && data.longitud) {
            return [data.latitud, data.longitud];
        }

        if (paisSeleccionado?.latitud && paisSeleccionado?.longitud) {
            return [paisSeleccionado.latitud, paisSeleccionado.longitud];
        }

        return [23.6345, -102.5528]; // México por defecto
    }, [data.latitud, data.longitud, paisSeleccionado]);

    const mapZoom = data.latitud && data.longitud ? 14 : paisSeleccionado ? 6 : 4;

    // ── Acciones de Empresa ───────────────────────────────────────────────────

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
            pais_telefono_id:         empresa.pais_telefono_id ?? (empresa.pais_id ?? ''),
            telefono:                 empresa.telefono || '',
            email:                    empresa.email || '',
            pais_id:                  empresa.pais_id ?? '',
            direccion:                empresa.direccion || '',
            latitud:                  empresa.latitud ?? null,
            longitud:                 empresa.longitud ?? null,
            zona_horaria:             empresa.zona_horaria || '',
        });
        setLogoFile(null);
        setLogoMiniFile(null);
        setLogoPreview(empresa.logo || null);
        setLogoMiniPreview(empresa.logo_mini || null);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (empresa: Empresa) => {
        setEditingEmpresa(null);
        setData({
            razon_social:             `${empresa.razon_social} (Copia)`,
            nombre_comercial:         empresa.nombre_comercial ? `${empresa.nombre_comercial} (Copia)` : '',
            documento:                '',
            representante_legal:      empresa.representante_legal || '',
            curp_representante_legal: empresa.curp_representante_legal || '',
            status:                   true,
            pais_telefono_id:         empresa.pais_telefono_id ?? (empresa.pais_id ?? ''),
            telefono:                 empresa.telefono || '',
            email:                    empresa.email || '',
            pais_id:                  empresa.pais_id ?? '',
            direccion:                empresa.direccion || '',
            latitud:                  empresa.latitud ?? null,
            longitud:                 empresa.longitud ?? null,
            zona_horaria:             empresa.zona_horaria || '',
        });
        setLogoFile(null);
        setLogoMiniFile(null);
        setLogoPreview(null);
        setLogoMiniPreview(null);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleToggleStatus = (empresa: Empresa) => {
        router.patch(`/admin/empresas/${empresa.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (empresa: Empresa) => {
        setDeletingEmpresa(empresa);
    };

    const confirmDelete = () => {
        if (!deletingEmpresa) {
            return;
        }

        router.delete(`/admin/empresas/${deletingEmpresa.id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any)?.notification;

                if (flash?.type === 'error') {
                    return;
                }

                setDeletingEmpresa(null);
            },
        });
    };

    // ── Logos ─────────────────────────────────────────────────────────────────

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
            onError: (errs) => {
                console.error('[Logo Upload] Validation errors:', errs);
                const firstError = Object.values(errs)[0] as string | undefined;
                notifyError(firstError ?? __('There was an error updating the logos. Please try again.'));
            },
            onFinish: () => setUploadingLogos(false),
        });
    };

    // ── Submit formulario ─────────────────────────────────────────────────────

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingEmpresa) {
            put(`/admin/empresas/${editingEmpresa.id}`, {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as any)?.notification;

                    if (flash?.type === 'error') {
                        return;
                    }

                    setIsModalOpen(false);
                    setEditingEmpresa(null);
                    reset();
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        } else {
            post('/admin/empresas', {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as any)?.notification;

                    if (flash?.type === 'error') {
                        return;
                    }

                    setIsModalOpen(false);
                    reset();
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        }
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

    // ── Filtro rápido por tarjetas KPI ────────────────────────────────────────

    const handleStatCardClick = (filterValue: string) => {
        setStatusFilter((prev) => (prev === filterValue ? '' : filterValue));
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter);

    // ── Dropdown menú de acciones compartido ───────────────────────────────────

    const renderActionMenu = (empresa: Empresa) => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{__('Actions')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditClick(empresa)}>
                        <Pencil className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {__('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateClick(empresa)}>
                        <Copy className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                        {__('Duplicate Company')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(empresa)}>
                        <ToggleRight className="mr-2 h-4 w-4 text-slate-600 dark:text-slate-400" />
                        {empresa.status ? __('Deactivate') : __('Activate')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleDeleteClick(empresa)}
                        className="text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {__('Delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // ── Columnas de la tabla ──────────────────────────────────────────────────

    const columns: ColumnDef<Empresa>[] = [
        {
            header: __('Company'),
            accessorKey: 'razon_social',
            sortable: true,
            sortKey: 'razon_social',
            className: 'font-medium',
            cell: (empresa) => (
                <div className="flex items-center gap-3 min-w-0">
                    {empresa.logo_mini || empresa.logo ? (
                        <img
                            src={empresa.logo_mini || empresa.logo || ''}
                            alt={empresa.razon_social}
                            className="w-10 h-10 rounded-xl object-contain border bg-slate-50 dark:bg-slate-900/50 p-1 shrink-0 shadow-xs"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 shadow-xs">
                            <Building2 className="w-5 h-5" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground truncate">{empresa.razon_social}</p>
                            {empresa.nombre_comercial && (
                                <span className="hidden sm:inline-block text-[11px] font-normal text-muted-foreground truncate">
                                    ({empresa.nombre_comercial})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-slate-200 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800">
                                {empresa.documento}
                            </Badge>
                            {empresa.representante_legal && (
                                <span className="text-xs text-muted-foreground truncate hidden md:inline">
                                    · {empresa.representante_legal}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: __('Country'),
            accessorKey: 'pais',
            hideOn: 'mobile',
            cell: (empresa) => (
                <span className="text-xs font-medium text-foreground/80">
                    {empresa.pais?.nombre ?? '—'}
                </span>
            ),
        },
        {
            header: __('Contact'),
            hideOn: 'tablet',
            cell: (empresa) => (
                <div className="space-y-1 text-xs">
                    {empresa.telefono ? (
                        <a
                            href={`tel:${empresa.telefono}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="font-medium">{empresa.telefono}</span>
                        </a>
                    ) : null}
                    {empresa.email ? (
                        <a
                            href={`mailto:${empresa.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[200px]"
                            title={empresa.email}
                        >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{empresa.email}</span>
                        </a>
                    ) : null}
                    {!empresa.telefono && !empresa.email && (
                        <span className="text-xs text-muted-foreground/60 italic">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Branches'),
            sortable: true,
            sortKey: 'sucursales_count',
            hideOn: 'mobile',
            cell: (empresa) => {
                const count = empresa.sucursales_count ?? 0;

                return (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            count > 0
                                ? 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        <GitBranch className="h-3 w-3 shrink-0" />
                        <span>{count}</span>
                    </span>
                );
            },
        },
        {
            header: __('Staff'),
            sortable: true,
            sortKey: 'users_count',
            hideOn: 'tablet',
            cell: (empresa) => {
                const count = empresa.users_count ?? 0;

                return (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            count > 0
                                ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{count}</span>
                    </span>
                );
            },
        },
        {
            header: __('Location'),
            hideOn: 'tablet',
            cell: (empresa) => {
                const hasGps = Boolean(empresa.latitud && empresa.longitud);

                return hasGps ? (
                    <a
                        href={`https://www.google.com/maps?q=${empresa.latitud},${empresa.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                        title={empresa.direccion || __('Open in Google Maps')}
                    >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {Number(empresa.latitud).toFixed(3)}, {Number(empresa.longitud).toFixed(3)}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                ) : empresa.direccion ? (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px] inline-block" title={empresa.direccion}>
                        {empresa.direccion}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground/60 italic">—</span>
                );
            },
        },
        {
            header: __('Time Zone'),
            hideOn: 'tablet',
            cell: (empresa) => (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{empresa.zona_horaria || __('Default')}</span>
                </div>
            ),
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'status',
            stopRowClick: true,
            cell: (empresa) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={empresa.status}
                        onCheckedChange={() => handleToggleStatus(empresa)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            empresa.status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {empresa.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (empresa) => renderActionMenu(empresa),
        },
    ];

    // ── Render de Vista Cuadrícula (Cards) ────────────────────────────────────

    const renderGridView = () => {
        if (empresas.data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-card/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{__('No companies found')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any companies in the database yet.')}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearAllFilters}>
                                <X className="mr-2 h-4 w-4" />
                                {__('Reset Filters')}
                            </Button>
                        )}
                        <Button onClick={handleCreateClick} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            {__('New Company')}
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {empresas.data.map((empresa) => {
                    const hasGps = Boolean(empresa.latitud && empresa.longitud);

                    return (
                        <div
                            key={empresa.id}
                            onClick={() => handleEditClick(empresa)}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-700/60 cursor-pointer"
                        >
                            {/* Cabecera de la Tarjeta */}
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {empresa.logo_mini || empresa.logo ? (
                                            <img
                                                src={empresa.logo_mini || empresa.logo || ''}
                                                alt={empresa.razon_social}
                                                className="w-12 h-12 rounded-xl object-contain border bg-slate-50 dark:bg-slate-900/60 p-1 shrink-0 shadow-xs"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 shadow-xs">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-base text-foreground leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {empresa.razon_social}
                                            </h3>
                                            {empresa.nombre_comercial && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {empresa.nombre_comercial}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Switch
                                            checked={empresa.status}
                                            onCheckedChange={() => handleToggleStatus(empresa)}
                                            className="scale-90"
                                        />
                                        {renderActionMenu(empresa)}
                                    </div>
                                </div>

                                {/* Badges & Documento */}
                                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                                    <Badge variant="outline" className="text-xs font-mono font-medium border-slate-200 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800">
                                        RFC: {empresa.documento}
                                    </Badge>
                                    {empresa.pais && (
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {empresa.pais.nombre}
                                        </Badge>
                                    )}
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs font-medium',
                                            empresa.status
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400'
                                        )}
                                    >
                                        {empresa.status ? __('Active') : __('Inactive')}
                                    </Badge>
                                </div>

                                {/* Detalles de Contacto y Representante */}
                                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                    {empresa.representante_legal && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                                <strong className="text-foreground/80 font-medium">{__('Legal Representative')}:</strong> {empresa.representante_legal}
                                            </span>
                                        </div>
                                    )}

                                    {empresa.telefono && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <a
                                                href={`tel:${empresa.telefono}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-foreground/80"
                                            >
                                                {empresa.telefono}
                                            </a>
                                        </div>
                                    )}

                                    {empresa.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                            <a
                                                href={`mailto:${empresa.email}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                                            >
                                                {empresa.email}
                                            </a>
                                        </div>
                                    )}

                                    {empresa.direccion && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2 leading-relaxed" title={empresa.direccion}>
                                                {empresa.direccion}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Barra Inferior / Métricas Relacionadas */}
                            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                            (empresa.sucursales_count ?? 0) > 0
                                                ? 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                        title={__('Branches')}
                                    >
                                        <GitBranch className="h-3 w-3 shrink-0" />
                                        <span>{empresa.sucursales_count ?? 0}</span>
                                    </span>

                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                            (empresa.users_count ?? 0) > 0
                                                ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                        title={__('Staff')}
                                    >
                                        <Users className="h-3 w-3 shrink-0" />
                                        <span>{empresa.users_count ?? 0}</span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {hasGps && (
                                        <a
                                            href={`https://www.google.com/maps?q=${empresa.latitud},${empresa.longitud}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                                            title={__('Open in Google Maps')}
                                        >
                                            <Navigation className="h-3 w-3" />
                                            <span>GPS</span>
                                        </a>
                                    )}

                                    {empresa.zona_horaria && (
                                        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                                            <Clock className="h-3 w-3 text-emerald-600" />
                                            <span className="truncate max-w-[90px]">{empresa.zona_horaria.split('/')[1] || empresa.zona_horaria}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Render Principal ──────────────────────────────────────────────────────

    return (
        <>
            <Head title={__('Companies')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado Principal de Módulo con degradado enriquecido */}
                <ModuleHeader
                    icon={<Building2 className="h-6 w-6 text-white" />}
                    title={__('Companies')}
                    description={__('Manage companies, their locations and contact information.')}
                    colorClassName="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 text-white shadow-md rounded-2xl"
                >
                    <Button
                        onClick={handleCreateClick}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs backdrop-blur-xs font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Company')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas Interactivas de KPI */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div
                        onClick={() => handleStatCardClick('')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === ''
                                ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<Building2 className="h-5 w-5" />}
                            title={__('TOTAL COMPANIES')}
                            value={stats.total}
                            colorClassName="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        />
                    </div>

                    <div
                        onClick={() => handleStatCardClick('1')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === '1'
                                ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            title={__('ACTIVE')}
                            value={stats.activos}
                            colorClassName="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        />
                    </div>

                    <div
                        onClick={() => handleStatCardClick('0')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === '0'
                                ? 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<XCircle className="h-5 w-5" />}
                            title={__('INACTIVE')}
                            value={stats.inactivos}
                            colorClassName="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        />
                    </div>

                    <div
                        onClick={() => handleStatCardClick('con_sucursales')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === 'con_sucursales'
                                ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<GitBranch className="h-5 w-5" />}
                            title={__('WITH BRANCHES')}
                            value={stats.con_sucursales ?? 0}
                            colorClassName="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                        />
                    </div>

                    <div
                        onClick={() => handleStatCardClick('con_usuarios')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl col-span-2 sm:col-span-1',
                            statusFilter === 'con_usuarios'
                                ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<Users className="h-5 w-5" />}
                            title={__('WITH STAFF')}
                            value={stats.con_usuarios ?? 0}
                            colorClassName="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                        />
                    </div>
                </div>

                {/* Barra de Control, Búsqueda y Filtros */}
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Buscador con icono y botón de limpiar */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Search by name, document, email...')}
                                    className="pl-9 pr-9 h-9 rounded-xl border-slate-200 dark:border-slate-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Selector de Estado */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-xl border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder={__('All Status')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All Status')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                    <SelectItem value="con_sucursales">{__('With Branches')}</SelectItem>
                                    <SelectItem value="con_usuarios">{__('With Staff')}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Registros por página */}
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full sm:w-[120px] h-9 rounded-xl border-slate-200 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 / {__('page')}</SelectItem>
                                    <SelectItem value="25">25 / {__('page')}</SelectItem>
                                    <SelectItem value="50">50 / {__('page')}</SelectItem>
                                    <SelectItem value="100">100 / {__('page')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selector de Modo de Vista (Grid vs Tabla) */}
                        <div className="flex items-center justify-end gap-1 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('table')}
                                    className={cn(
                                        'h-8 px-2.5 rounded-lg text-xs font-medium transition-all',
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-700 text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <List className="h-4 w-4 mr-1.5" />
                                    {__('Table')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        'h-8 px-2.5 rounded-lg text-xs font-medium transition-all',
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-700 text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <LayoutGrid className="h-4 w-4 mr-1.5" />
                                    {__('Grid')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Chips de Filtros Activos */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs text-muted-foreground font-medium">{__('Active filters')}:</span>
                            {searchTerm && (
                                <Badge variant="secondary" className="gap-1 rounded-lg text-xs py-1 px-2.5">
                                    <span>{__('Search')}: <strong>{searchTerm}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="ml-1 hover:text-foreground text-muted-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {statusFilter && (
                                <Badge variant="secondary" className="gap-1 rounded-lg text-xs py-1 px-2.5">
                                    <span>
                                        {__('Status')}:{' '}
                                        <strong>
                                            {statusFilter === '1'
                                                ? __('Active')
                                                : statusFilter === '0'
                                                ? __('Inactive')
                                                : statusFilter === 'con_sucursales'
                                                ? __('With Branches')
                                                : __('With Staff')}
                                        </strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('')}
                                        className="ml-1 hover:text-foreground text-muted-foreground"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {__('Clear all filters')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Visualización de Datos */}
                {viewMode === 'table' ? (
                    <div className="w-full">
                        <DataTable
                            data={empresas}
                            columns={columns}
                            isLoading={isTableLoading}
                            onRowClick={(empresa) => handleEditClick(empresa)}
                            emptyState={{
                                title: __('No companies found'),
                                description: hasActiveFilters
                                    ? __('Try clearing your search filters or changing your query.')
                                    : __('You have not registered any companies in the database yet.'),
                                ctaLabel: __('New Company'),
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {renderGridView()}
                        <Pagination paginatedData={empresas} filters={filters} />
                    </div>
                )}
            </div>

            {/* ── Modal de Creación / Edición / Duplicación ─────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                    <Building2 className="h-5 w-5" />
                                </div>
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
                                    <span>{__('General')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="contacto" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{__('Contact')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="ubicacion" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{__('Location')}</span>
                                </TabsTrigger>
                                {editingEmpresa && (
                                    <TabsTrigger value="logos" className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        <span>{__('Logos')}</span>
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            {/* ══ Tab 1: Información General ══════════════════════════════════════ */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 1. Razón social */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="razon_social" className="text-xs font-semibold">
                                            {__('Company Name')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="razon_social"
                                            value={data.razon_social}
                                            onChange={(e) => setData('razon_social', e.target.value)}
                                            placeholder="Ej: Organización Médica S.A. de C.V."
                                            className="rounded-xl"
                                        />
                                        {errors.razon_social && (
                                            <p className="text-red-500 text-xs mt-1">{errors.razon_social}</p>
                                        )}
                                    </div>

                                    {/* 2. Nombre comercial */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombre_comercial" className="text-xs font-semibold">
                                            {__('Trade Name')}
                                        </Label>
                                        <Input
                                            id="nombre_comercial"
                                            value={data.nombre_comercial || ''}
                                            onChange={(e) => setData('nombre_comercial', e.target.value)}
                                            placeholder="Ej: Clínica Santa María"
                                            className="rounded-xl"
                                        />
                                        {errors.nombre_comercial && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombre_comercial}</p>
                                        )}
                                    </div>

                                    {/* 3. RFC / Documento Fiscal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="documento" className="text-xs font-semibold">
                                            {__('Tax ID / RFC')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="documento"
                                            value={data.documento}
                                            onChange={(e) => setData('documento', e.target.value.toUpperCase())}
                                            placeholder="Ej: OMS120405AB1"
                                            className="rounded-xl font-mono uppercase"
                                        />
                                        {errors.documento && (
                                            <p className="text-red-500 text-xs mt-1">{errors.documento}</p>
                                        )}
                                    </div>

                                    {/* 4. Representante legal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="representante_legal" className="text-xs font-semibold">
                                            {__('Legal Representative')}
                                        </Label>
                                        <Input
                                            id="representante_legal"
                                            value={data.representante_legal || ''}
                                            onChange={(e) => setData('representante_legal', e.target.value)}
                                            placeholder="Ej: Lic. Roberto García Domínguez"
                                            className="rounded-xl"
                                        />
                                        {errors.representante_legal && (
                                            <p className="text-red-500 text-xs mt-1">{errors.representante_legal}</p>
                                        )}
                                    </div>

                                    {/* 5. CURP del representante legal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="curp_representante_legal" className="text-xs font-semibold">
                                            {__('CURP of Legal Representative')}
                                        </Label>
                                        <Input
                                            id="curp_representante_legal"
                                            value={data.curp_representante_legal || ''}
                                            onChange={(e) => setData('curp_representante_legal', e.target.value.toUpperCase())}
                                            placeholder="18 caracteres"
                                            maxLength={18}
                                            className="rounded-xl font-mono uppercase"
                                        />
                                        {errors.curp_representante_legal && (
                                            <p className="text-red-500 text-xs mt-1">{errors.curp_representante_legal}</p>
                                        )}
                                    </div>

                                    {/* 6. Estado Operativo */}
                                    <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label htmlFor="status" className="text-xs font-semibold block">
                                            {__('Operational Status')}
                                        </Label>
                                        <div className="flex items-center space-x-3 pt-1">
                                            <Switch
                                                id="status"
                                                checked={data.status}
                                                onCheckedChange={(checked) => setData('status', checked)}
                                            />
                                            <span className="text-sm font-medium">
                                                {data.status ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{__('Active')}</span>
                                                ) : (
                                                    <span className="text-slate-500">{__('Inactive')}</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Contacto ══════════════════════════════════════════════════ */}
                            <TabsContent value="contacto" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Teléfono */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="telefono" className="text-xs font-semibold">
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

                                    {/* Correo Electrónico */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="email" className="text-xs font-semibold">
                                            {__('Email')}
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email || ''}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="contacto@empresa.com"
                                            className="rounded-xl"
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 3: Ubicación & Mapa ══════════════════════════════════════════ */}
                            <TabsContent value="ubicacion" className="space-y-4">
                                {/* Selector de País */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="pais_id" className="text-xs font-semibold">
                                        {__('Country')}
                                    </Label>
                                    <Select
                                        value={String(data.pais_id || '')}
                                        onValueChange={(v) => {
                                            setData({
                                                ...data,
                                                pais_id:  v,
                                                latitud:  null,
                                                longitud: null,
                                                direccion: '',
                                            });
                                        }}
                                    >
                                        <SelectTrigger id="pais_id" className="w-full rounded-xl">
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
                                    <div className="space-y-1.5">
                                        <Label htmlFor="latitud" className="text-xs font-semibold">
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
                                            placeholder="23.6345"
                                            className="rounded-xl font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="longitud" className="text-xs font-semibold">
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
                                            placeholder="-102.5528"
                                            className="rounded-xl font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="direccion" className="text-xs font-semibold">
                                        {__('Address')}
                                    </Label>
                                    <Textarea
                                        id="direccion"
                                        value={data.direccion || ''}
                                        onChange={(e) => setData('direccion', e.target.value)}
                                        placeholder={__('The address will be auto-filled when you click on the map...')}
                                        rows={2}
                                        className="rounded-xl resize-none"
                                    />
                                </div>

                                {/* Zona Horaria */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="zona_horaria" className="text-xs font-semibold">
                                        {__('Time Zone (Auto-detected from map)')}
                                    </Label>
                                    <Input
                                        id="zona_horaria"
                                        value={data.zona_horaria || ''}
                                        onChange={(e) => setData('zona_horaria', e.target.value)}
                                        placeholder="Ej: America/Mexico_City, America/Tijuana, America/Mazatlan"
                                        className="rounded-xl font-mono text-xs"
                                    />
                                    {errors.zona_horaria && (
                                        <p className="text-red-500 text-xs mt-1">{errors.zona_horaria}</p>
                                    )}
                                </div>

                                {/* Mapa Leaflet interactivo */}
                                <div
                                    style={{ height: '360px', width: '100%' }}
                                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-900 shadow-inner"
                                >
                                    <Suspense
                                        fallback={
                                            <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                                <p>{__('Loading map...')}</p>
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

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Navigation className="h-3.5 w-3.5 text-indigo-500" />
                                    {__('Click on the map to set the exact location. The address will be obtained automatically.')}
                                </p>
                            </TabsContent>

                            {/* ══ Tab 4: Logos ═══════════════════════════════════════════════════ */}
                            {editingEmpresa && (
                                <TabsContent value="logos" className="space-y-6">
                                    <p className="text-xs text-muted-foreground">
                                        {__('Upload the company logos. The main logo is used in reports and documents. The mini logo (favicon) is used in the browser tab and small display areas.')}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Logo principal */}
                                        <div className="space-y-3">
                                            <Label className="flex items-center gap-2 text-xs font-semibold">
                                                <ImageIcon className="h-4 w-4 text-indigo-500" />
                                                {__('Main Logo')}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">({__('Reports & Documents')})</span>
                                            </Label>

                                            <div
                                                onClick={() => logoInputRef.current?.click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];

                                                    if (file) {
handleLogoFileChange(file, 'logo');
}
                                                }}
                                                className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                                                style={{ minHeight: '180px' }}
                                            >
                                                {logoPreview ? (
                                                    <>
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo principal"
                                                            className="w-full h-44 object-contain p-4"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-2xs">
                                                            <div className="text-white text-center">
                                                                <Upload className="h-6 w-6 mx-auto mb-1" />
                                                                <p className="text-xs">{__('Click to change')}</p>
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
                                                                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                            <ImageIcon className="h-7 w-7 text-indigo-400" />
                                                        </div>
                                                        <p className="text-xs font-medium">{__('Click or drag to upload')}</p>
                                                        <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 5MB</p>
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
                                            <Label className="flex items-center gap-2 text-xs font-semibold">
                                                <ImageIcon className="h-4 w-4 text-purple-500" />
                                                {__('Mini Logo')}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">({__('Favicon & small areas')})</span>
                                            </Label>

                                            <div
                                                onClick={() => logoMiniInputRef.current?.click()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];

                                                    if (file) {
handleLogoFileChange(file, 'logo_mini');
}
                                                }}
                                                className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 overflow-hidden bg-slate-50 dark:bg-slate-900/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/20"
                                                style={{ minHeight: '180px' }}
                                            >
                                                {logoMiniPreview ? (
                                                    <>
                                                        <img
                                                            src={logoMiniPreview}
                                                            alt="Logo mini"
                                                            className="w-full h-44 object-contain p-4"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-2xs">
                                                            <div className="text-white text-center">
                                                                <Upload className="h-6 w-6 mx-auto mb-1" />
                                                                <p className="text-xs">{__('Click to change')}</p>
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
                                                                className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                                                        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <ImageIcon className="h-7 w-7 text-purple-400" />
                                                        </div>
                                                        <p className="text-xs font-medium">{__('Click or drag to upload')}</p>
                                                        <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 2MB</p>
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
                                    <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <Button
                                            type="button"
                                            onClick={handleUploadLogos}
                                            disabled={uploadingLogos || (!logoFile && !logoMiniFile)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
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

                        <DialogFooter className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={processing}
                                className="rounded-xl"
                            >
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Diálogo de Confirmación de Eliminación ─────────────────────────── */}
            <AlertDialog open={Boolean(deletingEmpresa)} onOpenChange={(open) => !open && setDeletingEmpresa(null)}>
                <AlertDialogContent className="rounded-2xl sm:max-w-[480px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-semibold">
                                    {__('Delete Company')}
                                </AlertDialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {deletingEmpresa?.razon_social}
                                </p>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="space-y-3 py-2 text-sm text-muted-foreground">
                        {((deletingEmpresa?.sucursales_count ?? 0) > 0 || (deletingEmpresa?.users_count ?? 0) > 0) ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                                <p className="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    {__('Company has associated dependencies')}
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    {(deletingEmpresa?.sucursales_count ?? 0) > 0 && (
                                        <span>• {__('Branches registered')}: <strong>{deletingEmpresa?.sucursales_count}</strong><br /></span>
                                    )}
                                    {(deletingEmpresa?.users_count ?? 0) > 0 && (
                                        <span>• {__('Staff members assigned')}: <strong>{deletingEmpresa?.users_count}</strong><br /></span>
                                    )}
                                    {__('You cannot delete this company until you reassign or delete these related records first.')}
                                </p>
                            </div>
                        ) : (
                            <AlertDialogDescription className="text-sm">
                                {__('Are you sure you want to delete this company? This action will permanently delete the company from the database.')}
                            </AlertDialogDescription>
                        )}
                    </div>

                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl">
                            {__('Cancel')}
                        </AlertDialogCancel>
                        {((deletingEmpresa?.sucursales_count ?? 0) === 0 && (deletingEmpresa?.users_count ?? 0) === 0) ? (
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {__('Delete Company')}
                            </AlertDialogAction>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setDeletingEmpresa(null)}
                                className="rounded-xl"
                            >
                                {__('Understood')}
                            </Button>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
