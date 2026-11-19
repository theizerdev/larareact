import { Head, useForm, router } from '@inertiajs/react';
import { Map, Plus, Globe, CheckCircle, XCircle, Trash2, MoreVertical, Pencil, ToggleRight, Clock, Phone } from 'lucide-react';
import React, { useRef, useState, Suspense, lazy } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { EntityAvatar } from '@/components/entity-avatar';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import Pagination from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CardGridSkeleton, GridEmptyState, ViewModeToggle, useViewMode } from '@/components/view-mode-toggle';
import { useTranslate } from '@/hooks/use-translate';
import { cn, cleanParams } from '@/lib/utils';
import { bulkDestroy } from '@/routes/admin/paises';
import type { Auth } from '@/types';
import type { Paginated } from '@/types/app';

const MapComponent = lazy(() => {
    // Importamos el componente del mapa
    return import('./Partials/MapComponent').then(mod => ({ default: mod.default }));
});

// Define la estructura de un objeto País según el backend
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
}

// Define las props que la página recibe desde el controlador de Laravel
interface PaisesPageProps {
    auth: Auth;
    paises: Paginated<Pais>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        sortBy?: string;
        sortDir?: string;
    };
}

/**
 * Página principal para la gestión de Países.
 * Muestra estadísticas, filtros, una tabla de países y un mapa.
 *
 * @param {PaisesPageProps} props - Las propiedades inyectadas por Inertia.
 * @returns {JSX.Element}
 */
export default function PaisesIndexPage({ paises, stats, filters }: PaisesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Countries'), href: '/admin/paises' },
    ];

    const [viewMode, setViewMode] = useViewMode('smurfit_paises_view_mode', 'grid');
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingPais, setEditingPais] = React.useState<Pais | null>(null);
    // Estado local para manejar los filtros con debounce
    const [searchTerm, setSearchTerm] = React.useState(filters.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = React.useState(filters.perPage || '10');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isTableLoading, setIsTableLoading] = React.useState(false);
    const isFirstRender = useRef(true);

    const currentFilters = cleanParams({
        search: searchTerm,
        status: statusFilter,
        perPage: perPageFilter,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
    });

    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    // useEffect para manejar el debounce de la búsqueda
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            router.get(window.location.pathname, cleanParams({
                search: searchTerm,
                status: statusFilter,
                perPage: perPageFilter,
                sortBy: filters.sortBy,
                sortDir: filters.sortDir
            }), { preserveState: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, statusFilter, perPageFilter]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setPerPageFilter('10');
    };

    const toggleCardSelection = (id: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
    };
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm({
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
    });

    const handleCreateClick = () => {
        setEditingPais(null);
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (pais: Pais) => {
        setEditingPais(pais);
        setData({
            nombre: pais.nombre || '',
            codigo_iso2: pais.codigo_iso2 || '',
            codigo_iso3: pais.codigo_iso3 || '',
            codigo_telefonico: pais.codigo_telefonico || '',
            moneda_principal: pais.moneda_principal || '',
            idioma_principal: pais.idioma_principal || '',
            continente: pais.continente || '',
            latitud: pais.latitud !== undefined ? pais.latitud : null,
            longitud: pais.longitud !== undefined ? pais.longitud : null,
            zona_horaria: pais.zona_horaria || '',
            formato_fecha: pais.formato_fecha || 'Y-m-d',
            formato_moneda: pais.formato_moneda || ':symbol :value',
            impuesto_predeterminado: pais.impuesto_predeterminado !== undefined && pais.impuesto_predeterminado !== null ? Number(pais.impuesto_predeterminado) : 0,
            separador_miles: pais.separador_miles || ',',
            separador_decimales: pais.separador_decimales || '.',
            decimales_moneda: pais.decimales_moneda !== undefined && pais.decimales_moneda !== null ? Number(pais.decimales_moneda) : 2,
            activo: pais.activo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingPais) {
            put(`/admin/paises/${editingPais.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingPais(null);
                    reset();
                },
            });
        } else {
            post('/admin/paises', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleBulkDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleBulkDeleteConfirm = () => {
        router.post(bulkDestroy.url(), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setIsDeleteDialogOpen(false);
            },
            onError: () => {
                // Opcional: manejar errores de eliminación
            },
            preserveScroll: true,
        });
    };

    const handleToggleActive = (pais: Pais) => {
        router.put(`/admin/paises/${pais.id}`, {
            ...pais,
            activo: !pais.activo,
        }, {
            preserveScroll: true,
        });
    };

    const bulkActions = [
        {
            label: 'Delete selected',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: handleBulkDeleteClick,
            variant: 'destructive' as const,
        }
    ];

    const columns: ColumnDef<Pais>[] = [
        {
            header: 'Name',
            accessorKey: 'nombre',
            className: 'font-medium',
            sortable: true,
            cell: (pais) => (
                <div className="flex items-center gap-3">
                    <EntityAvatar
                        name={pais.nombre}
                        customInitials={pais.codigo_iso2}
                        status={pais.activo ? 'active' : 'inactive'}
                        size="sm"
                        shape="rounded"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {pais.nombre}
                        </p>
                        {(pais.continente || pais.codigo_telefonico) && (
                            <p className="text-xs text-muted-foreground">
                                {pais.continente || ''}
                                {pais.continente && pais.codigo_telefonico ? ' • ' : ''}
                                {pais.codigo_telefonico ? `+${pais.codigo_telefonico.replace(/^\+/, '')}` : ''}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'ISO2 Code',
            accessorKey: 'codigo_iso2',
            sortable: true,
            hideOn: 'mobile',
        },
        {
            header: 'ISO3 Code',
            accessorKey: 'codigo_iso3',
            sortable: true,
            hideOn: 'mobile',
        },
        {
            header: 'Status',
            sortable: true,
            sortKey: 'activo',
            stopRowClick: true,
            cell: (pais) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={pais.activo}
                        onCheckedChange={() => handleToggleActive(pais)}
                    />
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        pais.activo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800"
                    )}>
                        {pais.activo ? __('Active') : __('Inactive')}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (pais) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(pais)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(pais)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {pais.activo ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <>
            <Head title={__('Countries')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Map className="h-6 w-6 text-white" />}
                    title={__('Countries')}
                    description={__('Manage countries, codes, and geolocation.')}
                    colorClassName="bg-blue-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Country')}
                    </Button>
                </ModuleHeader>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Globe className="h-6 w-6" />}
                        title={__('TOTAL COUNTRIES')}
                        value={stats.total}
                        colorClassName="bg-blue-100 text-blue-600"
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

                <FilterBar className="rounded-2xl">
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, code...')}
                                className="w-full md:w-80 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Status')}>
                            <Select
                                value={statusFilter || 'all'}
                                onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
                            >
                                <SelectTrigger className="w-full md:w-44 rounded-xl">
                                    <SelectValue placeholder={__('All')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="1">{__('Active')}</SelectItem>
                                    <SelectItem value="0">{__('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Records per page')}>
                            <Select
                                value={perPageFilter}
                                onValueChange={(value) => setPerPageFilter(value)}
                            >
                                <SelectTrigger className="w-full md:w-36 rounded-xl">
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
                    <div className="flex items-center gap-2 shrink-0 self-end">
                        <Button variant="secondary" className="rounded-xl">{__('Export')}</Button>
                        <ViewModeToggle
                            value={viewMode}
                            onChange={setViewMode}
                            activeColorClassName="text-blue-600 dark:text-blue-400"
                        />
                    </div>
                </FilterBar>

                {viewMode === 'grid' ? (
                    <div className="space-y-4">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center justify-between gap-4 p-2.5 px-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                        {__(':count selected', { count: String(selectedIds.length) })}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="link"
                                        size="sm"
                                        className="text-blue-600 dark:text-blue-400 p-0 h-auto font-normal"
                                        onClick={() => setSelectedIds([])}
                                    >
                                        {__('Clear')}
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 gap-1.5 rounded-lg"
                                    onClick={handleBulkDeleteClick}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {__('Delete selected')}
                                </Button>
                            </div>
                        )}

                        {isTableLoading ? (
                            <CardGridSkeleton />
                        ) : paises.data.length === 0 ? (
                            <GridEmptyState
                                icon={<Globe className="h-6 w-6" />}
                                title={__('No countries found')}
                                description={
                                    searchTerm || statusFilter
                                        ? __('Try clearing your search filters or changing your query.')
                                        : __('You have not registered any countries in the database yet.')
                                }
                                hasActiveFilters={Boolean(searchTerm || statusFilter)}
                                onResetFilters={handleResetFilters}
                                ctaLabel={__('New Country')}
                                onCtaClick={handleCreateClick}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {paises.data.map((pais) => {
                                    const isSelected = selectedIds.includes(pais.id);

                                    return (
                                        <div
                                            key={pais.id}
                                            onClick={() => handleEditClick(pais)}
                                            className={cn(
                                                'group relative rounded-2xl border bg-card text-card-foreground shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer',
                                                isSelected
                                                    ? 'border-blue-500 ring-1 ring-blue-500/40'
                                                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-200/80 dark:hover:border-blue-800/60'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'h-1.5 w-full bg-gradient-to-r',
                                                    pais.activo
                                                        ? 'from-blue-500 via-sky-500 to-emerald-500'
                                                        : 'from-slate-400 to-slate-500'
                                                )}
                                            />

                                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="pt-1 shrink-0"
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) =>
                                                                        toggleCardSelection(pais.id, Boolean(checked))
                                                                    }
                                                                    aria-label={__('Select row')}
                                                                />
                                                            </div>
                                                            <EntityAvatar
                                                                name={pais.nombre}
                                                                customInitials={pais.codigo_iso2}
                                                                status={pais.activo ? 'active' : 'inactive'}
                                                                size="lg"
                                                                shape="rounded"
                                                            />
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                                                    {pais.nombre}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {pais.continente || __('Not specified')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                                    <DropdownMenuItem onClick={() => handleEditClick(pais)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        {__('Edit')}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleToggleActive(pais)}>
                                                                        <ToggleRight className="mr-2 h-4 w-4" />
                                                                        {pais.activo ? __('Deactivate') : __('Activate')}
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span
                                                            className={cn(
                                                                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                                                                pais.activo
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                            )}
                                                        >
                                                            {pais.activo ? __('Active') : __('Inactive')}
                                                        </span>
                                                        <Badge variant="secondary" className="font-mono text-[11px] rounded-full">
                                                            {pais.codigo_iso2} / {pais.codigo_iso3}
                                                        </Badge>
                                                        {pais.codigo_telefonico && (
                                                            <Badge variant="outline" className="font-mono text-[11px] rounded-full gap-1">
                                                                <Phone className="h-3 w-3 text-emerald-600" />
                                                                +{pais.codigo_telefonico.replace(/^\+/, '')}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 p-3 space-y-1.5 text-xs text-muted-foreground">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span>
                                                                {__('Currency')}:{' '}
                                                                <strong className="text-slate-700 dark:text-slate-200">
                                                                    {pais.moneda_principal || '—'}
                                                                </strong>
                                                            </span>
                                                            <span>
                                                                {__('Tax')}:{' '}
                                                                <strong className="font-mono text-slate-700 dark:text-slate-200">
                                                                    {pais.impuesto_predeterminado !== null && pais.impuesto_predeterminado !== undefined
                                                                        ? `${pais.impuesto_predeterminado}%`
                                                                        : '0%'}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                            <span className="font-mono text-[11px] truncate">
                                                                {pais.zona_horaria || __('Default')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={pais.activo}
                                                            onCheckedChange={() => handleToggleActive(pais)}
                                                        />
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {pais.activo ? __('Active') : __('Inactive')}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditClick(pais)}
                                                        className="h-8 px-3 rounded-xl text-xs gap-1.5 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        {__('Edit')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <Pagination paginatedData={paises} filters={currentFilters} />
                    </div>
                ) : (
                    <div className="w-full">
                        <DataTable
                            data={paises}
                            columns={columns}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            filters={currentFilters}
                            isLoading={isTableLoading}
                            onRowClick={(pais) => handleEditClick(pais)}
                            bulkActions={bulkActions}
                            emptyState={{
                                title: 'No countries found',
                                description: searchTerm || statusFilter
                                    ? 'Try clearing your search filters or changing your query.'
                                    : 'You have not registered any countries in the database yet.',
                                ctaLabel: 'New Country',
                                onCtaClick: handleCreateClick,
                            }}
                        />
                    </div>
                )}
            </div >

            {/* Modal de Creación/Edición */}
            < Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
                <DialogContent className="sm:max-w-[700px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingPais ? __('Edit Country') : __('New Country')}</DialogTitle>
                            <DialogDescription>
                                {__('Modify the country data by configuring its general information, display formats, and coordinates.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="general" className="w-full mt-4">
                            <TabsList className="grid grid-cols-3 w-full mb-6">
                                <TabsTrigger value="general">{__('General Information')}</TabsTrigger>
                                <TabsTrigger value="formats">{__('Formats & Taxes')}</TabsTrigger>
                                <TabsTrigger value="map">{__('Location (Map)')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="nombre">{__('Country Name')}</Label>
                                        <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} />
                                        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="continente">{__('Continent')}</Label>
                                        <Input id="continente" value={data.continente || ''} onChange={(e) => setData('continente', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="codigo_iso2">{__('ISO2 Code (2 letters)')}</Label>
                                        <Input id="codigo_iso2" value={data.codigo_iso2} onChange={(e) => setData('codigo_iso2', e.target.value)} maxLength={2} />
                                        {errors.codigo_iso2 && <p className="text-red-500 text-xs mt-1">{errors.codigo_iso2}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="codigo_iso3">{__('ISO3 Code (3 letters)')}</Label>
                                        <Input id="codigo_iso3" value={data.codigo_iso3} onChange={(e) => setData('codigo_iso3', e.target.value)} maxLength={3} />
                                        {errors.codigo_iso3 && <p className="text-red-500 text-xs mt-1">{errors.codigo_iso3}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="codigo_telefonico">{__('Phone Code')}</Label>
                                        <Input id="codigo_telefonico" value={data.codigo_telefonico || ''} onChange={(e) => setData('codigo_telefonico', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="idioma_principal">{__('Main Language')}</Label>
                                        <Input id="idioma_principal" value={data.idioma_principal || ''} onChange={(e) => setData('idioma_principal', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="zona_horaria">{__('Time Zone')}</Label>
                                        <Input id="zona_horaria" value={data.zona_horaria || ''} onChange={(e) => setData('zona_horaria', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="activo">{__('Country Status')}</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch id="activo" checked={data.activo} onCheckedChange={(checked) => setData('activo', checked)} />
                                            <span className="text-sm text-muted-foreground">{data.activo ? __('Active') : __('Inactive')}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="formats" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="moneda_principal">{__('Main Currency')}</Label>
                                        <Input id="moneda_principal" value={data.moneda_principal || ''} onChange={(e) => setData('moneda_principal', e.target.value)} placeholder="USD, EUR, MXN..." />
                                    </div>
                                    <div>
                                        <Label htmlFor="formato_moneda">{__('Currency Format')}</Label>
                                        <Input id="formato_moneda" value={data.formato_moneda || ''} onChange={(e) => setData('formato_moneda', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="separador_miles">{__('Thousands Separator')}</Label>
                                        <Input id="separador_miles" value={data.separador_miles || ''} onChange={(e) => setData('separador_miles', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="separador_decimales">{__('Decimal Separator')}</Label>
                                        <Input id="separador_decimales" value={data.separador_decimales || ''} onChange={(e) => setData('separador_decimales', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="decimales_moneda">{__('Currency Decimals')}</Label>
                                        <Input type="number" id="decimales_moneda" value={data.decimales_moneda || 0} onChange={(e) => setData('decimales_moneda', parseInt(e.target.value, 10))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="formato_fecha">{__('Date Format')}</Label>
                                        <Input id="formato_fecha" value={data.formato_fecha || ''} onChange={(e) => setData('formato_fecha', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="impuesto_predeterminado">{__('Default Tax (%)')}</Label>
                                        <Input type="number" step="0.01" id="impuesto_predeterminado" value={data.impuesto_predeterminado || 0} onChange={(e) => setData('impuesto_predeterminado', parseFloat(e.target.value))} />
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="map" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="latitud">{__('Latitude')}</Label>
                                        <Input
                                            id="latitud"
                                            type="number"
                                            step="any"
                                            value={data.latitud || ''}
                                            onChange={(e) => setData('latitud', e.target.value ? parseFloat(e.target.value) : null)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="longitud">{__('Longitude')}</Label>
                                        <Input
                                            id="longitud"
                                            type="number"
                                            step="any"
                                            value={data.longitud || ''}
                                            onChange={(e) => setData('longitud', e.target.value ? parseFloat(e.target.value) : null)}
                                        />
                                    </div>
                                </div>
                                <div style={{ height: '400px', width: '100%' }} className="rounded-md overflow-hidden border flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                    <Suspense fallback={<p className="text-slate-500">{__('Loading map...')}</p>}>
                                        {isModalOpen && (
                                            <MapComponent
                                                center={[data.latitud || 20, data.longitud || -100]}
                                                zoom={8}
                                                style={{ height: '100%', width: '100%' }}
                                                hasCoordinates={!!(data.latitud && data.longitud)}
                                                markerPosition={data.latitud && data.longitud ? [data.latitud, data.longitud] : null}
                                                onLocationSelected={(lat: number, lng: number) => setData({ ...data, latitud: lat, longitud: lng })}
                                            />
                                        )}
                                    </Suspense>
                                </div>
                                <p className="text-sm text-muted-foreground">{__('Click on the map to set the country coordinates or enter them manually in the fields above.')}</p>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-6 pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={processing}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? __('Saving...') : __('Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Diálogo de Confirmación de Eliminación */}
            < DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)
                }
                onConfirm={handleBulkDeleteConfirm}
                isConfirming={processing}
                title={selectedIds.length === 1 ? __('Delete country?') : __('Delete selected countries?')}
                description={
                    selectedIds.length === 1
                        ? __('Are you sure you want to delete :count country permanently? This action cannot be undone.', { count: '1' })
                        : __('Are you sure you want to delete :count countries permanently? This action cannot be undone.', { count: String(selectedIds.length) })
                }
            />
        </>
    );
}