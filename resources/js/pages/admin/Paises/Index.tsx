import { Head, useForm, router } from '@inertiajs/react';
import {
    Globe,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    Phone,
    MapPin,
    Building2,
    Clock,
    Search,
    X,
    LayoutGrid,
    List,
    Copy,
    CheckCircle2,
    XCircle,
    Navigation,
    ExternalLink,
    AlertTriangle,
    SlidersHorizontal,
    Coins,
    Languages,
    FileSpreadsheet,
} from 'lucide-react';
import React, { useState, Suspense, lazy } from 'react';
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
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifyError } from '@/utils/notifications';

const MapComponent = lazy(() => {
    return import('./Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

// ─── Componente Bandera con FlagIcon ──────────────────────────────────────────
import { CountryFlagIcon } from '@/components/country-flag-icon';
export { CountryFlagIcon };


// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
    codigo_iso3: string;
    codigo_telefonico?: string | null;
    moneda_principal?: string | null;
    idioma_principal?: string | null;
    continente?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    zona_horaria?: string | null;
    formato_fecha?: string | null;
    formato_moneda?: string | null;
    impuesto_predeterminado?: number | null;
    separador_miles?: string | null;
    separador_decimales?: string | null;
    decimales_moneda?: number | null;
    activo: boolean;
    empresas_count?: number;
    created_at?: string;
}

interface PaisesPageProps {
    paises: Paginated<Pais>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        con_empresas?: number;
        con_telefono?: number;
    };
    continentes?: string[];
    filters: {
        search?: string;
        status?: string;
        continente?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    nombre: '',
    codigo_iso2: '',
    codigo_iso3: '',
    codigo_telefonico: '',
    moneda_principal: '',
    idioma_principal: '',
    continente: '',
    latitud: null as number | null,
    longitud: null as number | null,
    zona_horaria: '',
    formato_fecha: 'Y-m-d',
    formato_moneda: ':symbol :value',
    impuesto_predeterminado: 0,
    separador_miles: ',',
    separador_decimales: '.',
    decimales_moneda: 2,
    activo: true,
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PaisesIndexPage({
    paises,
    stats,
    continentes = [],
    filters,
}: PaisesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Countries'), href: '/admin/paises' },
    ];

    // ── Estados de Interfaz ───────────────────────────────────────────────────
    const [viewMode, setViewMode]               = useState<'grid' | 'table'>('table');
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [editingPais, setEditingPais]         = useState<Pais | null>(null);
    const [deletingPais, setDeletingPais]       = useState<Pais | null>(null);
    const [activeTab, setActiveTab]             = useState('general');
    const [isTableLoading, setIsTableLoading]   = useState(false);
    const [selectedIds, setSelectedIds]         = useState<number[]>([]);

    // Filtros
    const [searchTerm, setSearchTerm]             = useState(filters.search || '');
    const [statusFilter, setStatusFilter]         = useState(filters.status || '');
    const [continenteFilter, setContinenteFilter] = useState(filters.continente || '');
    const [perPageFilter, setPerPageFilter]       = useState(filters.perPage || '10');

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
                continente: continenteFilter,
                perPage: perPageFilter,
                sortBy: filters.sortBy,
                sortDir: filters.sortDir,
            });

            const currentSearch = filters.search || '';
            const currentStatus = filters.status || '';
            const currentContinente = filters.continente || '';
            const currentPerPage = filters.perPage || '10';

            if (
                searchTerm !== currentSearch ||
                statusFilter !== currentStatus ||
                continenteFilter !== currentContinente ||
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
    }, [searchTerm, statusFilter, continenteFilter, perPageFilter, filters]);

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Acciones ──────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingPais(null);
        reset();
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (pais: Pais) => {
        setEditingPais(pais);
        setData({
            nombre:                  pais.nombre || '',
            codigo_iso2:             pais.codigo_iso2 || '',
            codigo_iso3:             pais.codigo_iso3 || '',
            codigo_telefonico:       pais.codigo_telefonico || '',
            moneda_principal:        pais.moneda_principal || '',
            idioma_principal:        pais.idioma_principal || '',
            continente:              pais.continente || '',
            latitud:                 pais.latitud !== undefined && pais.latitud !== null ? Number(pais.latitud) : null,
            longitud:                pais.longitud !== undefined && pais.longitud !== null ? Number(pais.longitud) : null,
            zona_horaria:            pais.zona_horaria || '',
            formato_fecha:           pais.formato_fecha || 'Y-m-d',
            formato_moneda:          pais.formato_moneda || ':symbol :value',
            impuesto_predeterminado: pais.impuesto_predeterminado !== undefined && pais.impuesto_predeterminado !== null ? Number(pais.impuesto_predeterminado) : 0,
            separador_miles:         pais.separador_miles || ',',
            separador_decimales:     pais.separador_decimales || '.',
            decimales_moneda:        pais.decimales_moneda !== undefined && pais.decimales_moneda !== null ? Number(pais.decimales_moneda) : 2,
            activo:                  pais.activo,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleDuplicateClick = (pais: Pais) => {
        setEditingPais(null);
        setData({
            nombre:                  `${pais.nombre} (Copia)`,
            codigo_iso2:             '',
            codigo_iso3:             '',
            codigo_telefonico:       pais.codigo_telefonico || '',
            moneda_principal:        pais.moneda_principal || '',
            idioma_principal:        pais.idioma_principal || '',
            continente:              pais.continente || '',
            latitud:                 pais.latitud !== undefined && pais.latitud !== null ? Number(pais.latitud) : null,
            longitud:                pais.longitud !== undefined && pais.longitud !== null ? Number(pais.longitud) : null,
            zona_horaria:            pais.zona_horaria || '',
            formato_fecha:           pais.formato_fecha || 'Y-m-d',
            formato_moneda:          pais.formato_moneda || ':symbol :value',
            impuesto_predeterminado: pais.impuesto_predeterminado !== undefined && pais.impuesto_predeterminado !== null ? Number(pais.impuesto_predeterminado) : 0,
            separador_miles:         pais.separador_miles || ',',
            separador_decimales:     pais.separador_decimales || '.',
            decimales_moneda:        pais.decimales_moneda !== undefined && pais.decimales_moneda !== null ? Number(pais.decimales_moneda) : 2,
            activo:                  true,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleToggleStatus = (pais: Pais) => {
        router.patch(`/admin/paises/${pais.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (pais: Pais) => {
        setDeletingPais(pais);
    };

    const confirmDelete = () => {
        if (!deletingPais) {
            return;
        }

        router.delete(`/admin/paises/${deletingPais.id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = (page.props as any)?.notification;

                if (flash?.type === 'error') {
                    return;
                }

                setDeletingPais(null);
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingPais) {
            put(`/admin/paises/${editingPais.id}`, {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as any)?.notification;

                    if (flash?.type === 'error') {
                        return;
                    }

                    setIsModalOpen(false);
                    setEditingPais(null);
                    reset();
                },
                onError: () => {
                    notifyError(__('Please review the highlighted fields.'));
                },
            });
        } else {
            post('/admin/paises', {
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

    // ── Filtro rápido por tarjetas KPI ────────────────────────────────────────

    const handleStatCardClick = (filterValue: string) => {
        setStatusFilter((prev) => (prev === filterValue ? '' : filterValue));
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setContinenteFilter('');
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || continenteFilter);

    // ── Dropdown menú de acciones compartido ───────────────────────────────────

    const renderActionMenu = (pais: Pais) => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{__('Actions')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleEditClick(pais)}>
                        <Pencil className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {__('Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateClick(pais)}>
                        <Copy className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                        {__('Duplicate Country')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(pais)}>
                        <ToggleRight className="mr-2 h-4 w-4 text-slate-600 dark:text-slate-400" />
                        {pais.activo ? __('Deactivate') : __('Activate')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleDeleteClick(pais)}
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

    const columns: ColumnDef<Pais>[] = [
        {
            header: __('Country'),
            accessorKey: 'nombre',
            sortable: true,
            sortKey: 'nombre',
            className: 'font-medium',
            cell: (pais) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                        <CountryFlagIcon iso2={pais.codigo_iso2} className="text-2xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">{pais.nombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {pais.continente && (
                                <span className="text-[11px] text-muted-foreground truncate font-normal">
                                    {pais.continente}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: __('Codes'),
            hideOn: 'mobile',
            cell: (pais) => (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Badge variant="outline" className="text-[11px] font-semibold px-1.5 py-0 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                        {pais.codigo_iso2}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] font-normal px-1.5 py-0 text-muted-foreground">
                        {pais.codigo_iso3}
                    </Badge>
                </div>
            ),
        },
        {
            header: __('Phone Code'),
            sortable: true,
            sortKey: 'codigo_telefonico',
            hideOn: 'mobile',
            cell: (pais) => (
                pais.codigo_telefonico ? (
                    <div className="inline-flex items-center gap-1 text-xs font-mono font-medium text-foreground/85">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{pais.codigo_telefonico.startsWith('+') ? pais.codigo_telefonico : `+${pais.codigo_telefonico}`}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground/60 italic">—</span>
                )
            ),
        },
        {
            header: __('Currency & Language'),
            hideOn: 'tablet',
            cell: (pais) => (
                <div className="space-y-0.5 text-xs text-muted-foreground">
                    {pais.moneda_principal && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{pais.moneda_principal}</span>
                        </div>
                    )}
                    {pais.idioma_principal && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="uppercase">{pais.idioma_principal}</span>
                        </div>
                    )}
                    {!pais.moneda_principal && !pais.idioma_principal && (
                        <span className="italic">—</span>
                    )}
                </div>
            ),
        },
        {
            header: __('Companies'),
            sortable: true,
            sortKey: 'empresas_count',
            hideOn: 'tablet',
            cell: (pais) => {
                const count = pais.empresas_count ?? 0;

                return (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            count > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span>{count}</span>
                    </span>
                );
            },
        },
        {
            header: __('Location'),
            hideOn: 'tablet',
            cell: (pais) => {
                const hasGps = Boolean(pais.latitud && pais.longitud);

                return hasGps ? (
                    <a
                        href={`https://www.google.com/maps?q=${pais.latitud},${pais.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline dark:text-teal-400"
                        title={__('Open in Google Maps')}
                    >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {Number(pais.latitud).toFixed(2)}, {Number(pais.longitud).toFixed(2)}
                        </span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                    </a>
                ) : (
                    <span className="text-xs text-muted-foreground/60 italic">—</span>
                );
            },
        },
        {
            header: __('Status'),
            sortable: true,
            sortKey: 'activo',
            stopRowClick: true,
            cell: (pais) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={pais.activo}
                        onCheckedChange={() => handleToggleStatus(pais)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            pais.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {pais.activo ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (pais) => renderActionMenu(pais),
        },
    ];

    // ── Render de Vista Cuadrícula (Cards) ────────────────────────────────────

    const renderGridView = () => {
        if (paises.data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-card/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mb-4 shadow-xs">
                        <Globe className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{__('No countries found')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                        {hasActiveFilters
                            ? __('Try clearing your search filters or changing your query.')
                            : __('You have not registered any countries in the database yet.')}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearAllFilters}>
                                <X className="mr-2 h-4 w-4" />
                                {__('Reset Filters')}
                            </Button>
                        )}
                        <Button onClick={handleCreateClick} className="bg-teal-600 hover:bg-teal-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            {__('New Country')}
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paises.data.map((pais) => {
                    const hasGps = Boolean(pais.latitud && pais.longitud);

                    return (
                        <div
                            key={pais.id}
                            onClick={() => handleEditClick(pais)}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:hover:border-teal-700/60 cursor-pointer"
                        >
                            <div>
                                {/* Cabecera de Tarjeta: Bandera SVG + Título + Acciones */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                                            <CountryFlagIcon iso2={pais.codigo_iso2} className="text-3xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-base text-foreground leading-tight truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                {pais.nombre}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {pais.continente || __('Worldwide')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Switch
                                            checked={pais.activo}
                                            onCheckedChange={() => handleToggleStatus(pais)}
                                            className="scale-90"
                                        />
                                        {renderActionMenu(pais)}
                                    </div>
                                </div>

                                {/* Badges de Códigos ISO y Prefijo */}
                                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                                    <Badge variant="outline" className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 font-semibold px-2">
                                        {pais.codigo_iso2}
                                    </Badge>
                                    <Badge variant="secondary" className="font-normal px-2">
                                        {pais.codigo_iso3}
                                    </Badge>
                                    {pais.codigo_telefonico && (
                                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800 font-sans font-medium">
                                            {pais.codigo_telefonico.startsWith('+') ? pais.codigo_telefonico : `+${pais.codigo_telefonico}`}
                                        </Badge>
                                    )}
                                </div>

                                {/* Detalles de Moneda e Idioma */}
                                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                    {pais.moneda_principal && (
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                <span>{__('Currency')}:</span>
                                            </span>
                                            <span className="font-semibold text-foreground/80 font-mono">
                                                {pais.moneda_principal}
                                            </span>
                                        </div>
                                    )}

                                    {pais.idioma_principal && (
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span>{__('Language')}:</span>
                                            </span>
                                            <span className="font-medium text-foreground/80 uppercase font-mono">
                                                {pais.idioma_principal}
                                            </span>
                                        </div>
                                    )}

                                    {pais.zona_horaria && (
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                <span>{__('Time Zone')}:</span>
                                            </span>
                                            <span className="font-mono text-[11px] truncate max-w-[130px] text-right">
                                                {pais.zona_horaria.split('/')[1] || pais.zona_horaria}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Barra Inferior */}
                            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                        (pais.empresas_count ?? 0) > 0
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                    title={__('Companies')}
                                >
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span>{pais.empresas_count ?? 0} {__('Companies')}</span>
                                </span>

                                {hasGps && (
                                    <a
                                        href={`https://www.google.com/maps?q=${pais.latitud},${pais.longitud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline"
                                        title={__('Open in Google Maps')}
                                    >
                                        <Navigation className="h-3 w-3" />
                                        <span>GPS</span>
                                    </a>
                                )}
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
            <Head title={__('Countries')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Encabezado Principal de Módulo con degradado temático */}
                <ModuleHeader
                    icon={<Globe className="h-6 w-6 text-white" />}
                    title={__('Countries')}
                    description={__('Manage countries, codes, and geolocation.')}
                    colorClassName="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 text-white shadow-md rounded-2xl"
                >
                    <Button
                        onClick={handleCreateClick}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs backdrop-blur-xs font-medium"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Country')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas Interactivas de KPI */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div
                        onClick={() => handleStatCardClick('')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === ''
                                ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<Globe className="h-5 w-5" />}
                            title={__('TOTAL COUNTRIES')}
                            value={stats.total}
                            colorClassName="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
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
                        onClick={() => handleStatCardClick('con_empresas')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl',
                            statusFilter === 'con_empresas'
                                ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<Building2 className="h-5 w-5" />}
                            title={__('WITH COMPANIES')}
                            value={stats.con_empresas ?? 0}
                            colorClassName="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        />
                    </div>

                    <div
                        onClick={() => handleStatCardClick('con_telefono')}
                        className={cn(
                            'cursor-pointer transition-all duration-200 rounded-2xl col-span-2 sm:col-span-1',
                            statusFilter === 'con_telefono'
                                ? 'ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm'
                                : 'opacity-90 hover:opacity-100 hover:shadow-xs'
                        )}
                    >
                        <StatCard
                            icon={<Phone className="h-5 w-5" />}
                            title={__('WITH PHONE CODE')}
                            value={stats.con_telefono ?? 0}
                            colorClassName="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                        />
                    </div>
                </div>

                {/* Barra de Búsqueda y Filtros */}
                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Buscador con icono y botón de limpiar */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Search by name, code...')}
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
                                <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-xl border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder={__('All Status')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All Status')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                    <SelectItem value="con_empresas">{__('With Companies')}</SelectItem>
                                    <SelectItem value="con_telefono">{__('With Phone Code')}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Selector de Continente */}
                            {continentes.length > 0 && (
                                <Select value={continenteFilter} onValueChange={setContinenteFilter}>
                                    <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-xl border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <SelectValue placeholder={__('All Continents')} />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{__('All Continents')}</SelectItem>
                                        {continentes.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

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

                        {/* Selector de Modo de Vista */}
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
                                                : statusFilter === 'con_empresas'
                                                ? __('With Companies')
                                                : __('With Phone Code')}
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
                            {continenteFilter && (
                                <Badge variant="secondary" className="gap-1 rounded-lg text-xs py-1 px-2.5">
                                    <span>{__('Continent')}: <strong>{continenteFilter}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => setContinenteFilter('')}
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
                            data={paises}
                            columns={columns}
                            isLoading={isTableLoading}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            onRowClick={(pais) => handleEditClick(pais)}
                            emptyState={{
                                title: __('No countries found'),
                                description: hasActiveFilters
                                    ? __('Try clearing your search filters or changing your query.')
                                    : __('You have not registered any countries in the database yet.'),
                                ctaLabel: __('New Country'),
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {renderGridView()}
                        <Pagination paginatedData={paises} filters={filters} />
                    </div>
                )}
            </div>

            {/* ── Modal de Creación / Edición / Duplicación ─────────────────────────── */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold">
                                <CountryFlagIcon iso2={data.codigo_iso2} className="text-2xl" />
                                <span>{editingPais ? __('Edit Country') : __('New Country')}</span>
                            </DialogTitle>
                            <DialogDescription>
                                {__('Modify the country data by configuring its general information, display formats, and coordinates.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                            <TabsList className="grid grid-cols-3 w-full mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>{__('General')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="formats" className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span>{__('Formats & Currency')}</span>
                                </TabsTrigger>
                                <TabsTrigger value="map" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{__('Location & Map')}</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* ══ Tab 1: Información General ══════════════════════════════════════ */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nombre del País */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="nombre" className="text-xs font-semibold">
                                            {__('Country Name')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="nombre"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            placeholder="Ej: México, Colombia, España"
                                            className="rounded-xl"
                                        />
                                        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                                    </div>

                                    {/* Código ISO2 */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="codigo_iso2" className="text-xs font-semibold flex items-center justify-between">
                                            <span>{__('ISO2 Code (2 letters)')} <span className="text-red-500">*</span></span>
                                            {data.codigo_iso2 && (
                                                <span className="flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                                                    <CountryFlagIcon iso2={data.codigo_iso2} className="text-sm" />
                                                    {data.codigo_iso2.toUpperCase()}
                                                </span>
                                            )}
                                        </Label>
                                        <Input
                                            id="codigo_iso2"
                                            value={data.codigo_iso2}
                                            onChange={(e) => setData('codigo_iso2', e.target.value.toUpperCase())}
                                            maxLength={2}
                                            placeholder="MX, CO, ES..."
                                            className="rounded-xl font-mono uppercase"
                                        />
                                        {errors.codigo_iso2 && <p className="text-red-500 text-xs mt-1">{errors.codigo_iso2}</p>}
                                    </div>

                                    {/* Código ISO3 */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="codigo_iso3" className="text-xs font-semibold">
                                            {__('ISO3 Code (3 letters)')} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="codigo_iso3"
                                            value={data.codigo_iso3}
                                            onChange={(e) => setData('codigo_iso3', e.target.value.toUpperCase())}
                                            maxLength={3}
                                            placeholder="MEX, COL, ESP..."
                                            className="rounded-xl font-mono uppercase"
                                        />
                                        {errors.codigo_iso3 && <p className="text-red-500 text-xs mt-1">{errors.codigo_iso3}</p>}
                                    </div>

                                    {/* Código Telefónico */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="codigo_telefonico" className="text-xs font-semibold">
                                            {__('Phone Code')}
                                        </Label>
                                        <Input
                                            id="codigo_telefonico"
                                            value={data.codigo_telefonico || ''}
                                            onChange={(e) => setData('codigo_telefonico', e.target.value)}
                                            placeholder="+52, +57, +34..."
                                            className="rounded-xl font-mono"
                                        />
                                        {errors.codigo_telefonico && <p className="text-red-500 text-xs mt-1">{errors.codigo_telefonico}</p>}
                                    </div>

                                    {/* Continente */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="continente" className="text-xs font-semibold">
                                            {__('Continent')}
                                        </Label>
                                        <Input
                                            id="continente"
                                            value={data.continente || ''}
                                            onChange={(e) => setData('continente', e.target.value)}
                                            placeholder="América, Europa, Asia..."
                                            className="rounded-xl"
                                        />
                                        {errors.continente && <p className="text-red-500 text-xs mt-1">{errors.continente}</p>}
                                    </div>

                                    {/* Idioma Principal */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="idioma_principal" className="text-xs font-semibold">
                                            {__('Main Language')}
                                        </Label>
                                        <Input
                                            id="idioma_principal"
                                            value={data.idioma_principal || ''}
                                            onChange={(e) => setData('idioma_principal', e.target.value.toLowerCase())}
                                            placeholder="es, en, pt..."
                                            className="rounded-xl font-mono lowercase"
                                        />
                                    </div>

                                    {/* Estado */}
                                    <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label htmlFor="activo" className="text-xs font-semibold block">
                                            {__('Operational Status')}
                                        </Label>
                                        <div className="flex items-center space-x-3 pt-1">
                                            <Switch
                                                id="activo"
                                                checked={data.activo}
                                                onCheckedChange={(checked) => setData('activo', checked)}
                                            />
                                            <span className="text-sm font-medium">
                                                {data.activo ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{__('Active')}</span>
                                                ) : (
                                                    <span className="text-slate-500">{__('Inactive')}</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Formatos & Moneda ═════════════════════════════════════════ */}
                            <TabsContent value="formats" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="moneda_principal" className="text-xs font-semibold">
                                            {__('Main Currency')}
                                        </Label>
                                        <Input
                                            id="moneda_principal"
                                            value={data.moneda_principal || ''}
                                            onChange={(e) => setData('moneda_principal', e.target.value.toUpperCase())}
                                            placeholder="MXN, USD, EUR, COP..."
                                            className="rounded-xl font-mono uppercase"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="formato_moneda" className="text-xs font-semibold">
                                            {__('Currency Format')}
                                        </Label>
                                        <Input
                                            id="formato_moneda"
                                            value={data.formato_moneda || ''}
                                            onChange={(e) => setData('formato_moneda', e.target.value)}
                                            placeholder=":symbol :value"
                                            className="rounded-xl font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="separador_miles" className="text-xs font-semibold">
                                            {__('Thousands Separator')}
                                        </Label>
                                        <Input
                                            id="separador_miles"
                                            value={data.separador_miles || ''}
                                            onChange={(e) => setData('separador_miles', e.target.value)}
                                            maxLength={1}
                                            placeholder=","
                                            className="rounded-xl text-center font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="separador_decimales" className="text-xs font-semibold">
                                            {__('Decimal Separator')}
                                        </Label>
                                        <Input
                                            id="separador_decimales"
                                            value={data.separador_decimales || ''}
                                            onChange={(e) => setData('separador_decimales', e.target.value)}
                                            maxLength={1}
                                            placeholder="."
                                            className="rounded-xl text-center font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="decimales_moneda" className="text-xs font-semibold">
                                            {__('Currency Decimals')}
                                        </Label>
                                        <Input
                                            type="number"
                                            id="decimales_moneda"
                                            value={data.decimales_moneda || 0}
                                            onChange={(e) => setData('decimales_moneda', parseInt(e.target.value, 10))}
                                            className="rounded-xl font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="formato_fecha" className="text-xs font-semibold">
                                            {__('Date Format')}
                                        </Label>
                                        <Input
                                            id="formato_fecha"
                                            value={data.formato_fecha || ''}
                                            onChange={(e) => setData('formato_fecha', e.target.value)}
                                            placeholder="Y-m-d, d/m/Y..."
                                            className="rounded-xl font-mono text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="impuesto_predeterminado" className="text-xs font-semibold">
                                            {__('Default Tax (%)')}
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            id="impuesto_predeterminado"
                                            value={data.impuesto_predeterminado || 0}
                                            onChange={(e) => setData('impuesto_predeterminado', parseFloat(e.target.value))}
                                            className="rounded-xl font-mono"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 3: Ubicación & Mapa ══════════════════════════════════════════ */}
                            <TabsContent value="map" className="space-y-4">
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

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="zona_horaria" className="text-xs font-semibold">
                                            {__('Time Zone')}
                                        </Label>
                                        <Input
                                            id="zona_horaria"
                                            value={data.zona_horaria || ''}
                                            onChange={(e) => setData('zona_horaria', e.target.value)}
                                            placeholder="America/Mexico_City, Europe/Madrid..."
                                            className="rounded-xl font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{ height: '360px', width: '100%' }}
                                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-900 shadow-inner"
                                >
                                    <Suspense
                                        fallback={
                                            <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                                <p>{__('Loading map...')}</p>
                                            </div>
                                        }
                                    >
                                        {isModalOpen && activeTab === 'map' && (
                                            <MapComponent
                                                center={[data.latitud || 23.6345, data.longitud || -102.5528]}
                                                zoom={data.latitud && data.longitud ? 5 : 2}
                                                style={{ height: '100%', width: '100%' }}
                                                hasCoordinates={Boolean(data.latitud && data.longitud)}
                                                markerPosition={
                                                    data.latitud && data.longitud
                                                        ? [data.latitud, data.longitud]
                                                        : null
                                                }
                                                onLocationSelected={(lat: number, lng: number) =>
                                                    setData({ ...data, latitud: lat, longitud: lng })
                                                }
                                            />
                                        )}
                                    </Suspense>
                                </div>

                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Navigation className="h-3.5 w-3.5 text-teal-600" />
                                    {__('Click on the map to set the country coordinates or enter them manually in the fields above.')}
                                </p>
                            </TabsContent>
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
                            <Button type="submit" disabled={processing} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs">
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Diálogo de Confirmación de Eliminación ─────────────────────────── */}
            <AlertDialog open={Boolean(deletingPais)} onOpenChange={(open) => !open && setDeletingPais(null)}>
                <AlertDialogContent className="rounded-2xl sm:max-w-[480px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-semibold">
                                    {__('Delete Country')}
                                </AlertDialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                    <CountryFlagIcon iso2={deletingPais?.codigo_iso2} className="text-base" />
                                    <span>{deletingPais?.nombre} ({deletingPais?.codigo_iso2})</span>
                                </p>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <div className="space-y-3 py-2 text-sm text-muted-foreground">
                        {(deletingPais?.empresas_count ?? 0) > 0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                                <p className="font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-200">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    {__('Country has associated dependencies')}
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    <span>• {__('Companies registered')}: <strong>{deletingPais?.empresas_count}</strong><br /></span>
                                    {__('Cannot delete this country because it is referenced by companies, branches or users.')}
                                </p>
                            </div>
                        ) : (
                            <AlertDialogDescription className="text-sm">
                                {__('Are you sure you want to delete this country? This action will permanently delete the country from the database.')}
                            </AlertDialogDescription>
                        )}
                    </div>

                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl">
                            {__('Cancel')}
                        </AlertDialogCancel>
                        {(deletingPais?.empresas_count ?? 0) === 0 ? (
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {__('Delete Country')}
                            </AlertDialogAction>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setDeletingPais(null)}
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