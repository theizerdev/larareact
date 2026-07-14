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
import { notifySuccess, notifyError } from '@/utils/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Layers,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    ToggleRight,
    MapPin,
    Building2,
    User,
    Tag,
    Hash,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DepartamentoMapComponent = lazy(() => {
    return import('../Empresas/Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Empresa {
    id: number;
    razon_social: string;
}

interface Sucursal {
    id: number;
    nombre: string;
    empresa_id: number;
    latitud?: number | null;
    longitud?: number | null;
}

interface Usuario {
    id: number;
    name: string;
    email: string;
}

interface Departamento {
    id: number;
    nombre: string;
    codigo?: string | null;
    responsable?: string | null;
    piso?: string | null;
    ubicacion?: string | null;
    descripcion?: string | null;
    empresa_id: number;
    sucursal_id: number;
    user_id: number;
    status: number;
    latitud?: number | null;
    longitud?: number | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
    user?: Usuario | null;
}

interface DepartamentosPageProps {
    auth: Auth;
    departamentos: Paginated<Departamento>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
    };
    empresas: Empresa[];
    sucursales: Sucursal[];
    usuarios: Usuario[];
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
    };
    empresa?: {
        id: number;
        latitud?: number | null;
        longitud?: number | null;
        mapbox_api_key?: string | null;
        mapbox_active?: boolean;
    } | null;
    sucursal?: {
        id: number;
        latitud?: number | null;
        longitud?: number | null;
    } | null;
}

// ─── Formulario inicial vacío ─────────────────────────────────────────────────

const initialForm = {
    nombre: '',
    codigo: '',
    responsable: '',
    piso: '',
    ubicacion: '',
    descripcion: '',
    empresa_id: '' as string | number,
    sucursal_id: '' as string | number,
    user_id: '' as string | number,
    status: 1 as number,
    latitud: null as number | null,
    longitud: null as number | null,
};

// ─── Página principal ──────────────────────────────────────────────────────────

export default function DepartamentosIndexPage({
    auth,
    departamentos,
    stats,
    empresas,
    sucursales,
    usuarios,
    filters,
    empresa: appEmpresa,
    sucursal: appSucursal,
}: DepartamentosPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Departments'), href: '/admin/departamentos' },
    ];

    // ── Estados ────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]                 = useState(false);
    const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);
    const [deletingDepartamento, setDeletingDepartamento] = useState<Departamento | null>(null);
    const [activeTab, setActiveTab]                     = useState('general');
    const [isTableLoading, setIsTableLoading]           = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]         = useState(filters.search || '');
    const [statusFilter, setStatusFilter]     = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter]   = useState(filters.perPage || '10');

    // ── Hooks de navegación ────────────────────────────────────────────────────
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
                cleanParams({
                    search:  searchTerm,
                    status:  statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter]);

    // ── Formulario Inertia ─────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);

    // ── Filtro de sucursales según empresa seleccionada ─────────────────────────
    const filteredSucursales = sucursales.filter(s => s.empresa_id === Number(data.empresa_id));

    // ── Mapa ───────────────────────────────────────────────────────────────────
    const selectedSucursal = sucursales.find(s => s.id === Number(data.sucursal_id));
    const mapCenter: [number, number] =
        data.latitud && data.longitud
            ? [data.latitud, data.longitud]
            : selectedSucursal?.latitud && selectedSucursal?.longitud
            ? [selectedSucursal.latitud, selectedSucursal.longitud]
            : appSucursal?.latitud && appSucursal?.longitud
            ? [appSucursal.latitud, appSucursal.longitud]
            : appEmpresa?.latitud && appEmpresa?.longitud
            ? [appEmpresa.latitud, appEmpresa.longitud]
            : [10.48801, -66.87919]; // Default Caracas

    const mapZoom = data.latitud && data.longitud ? 14 : selectedSucursal ? 13 : 11;

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setEditingDepartamento(null);
        reset();
        // Si el usuario tiene una empresa y sucursal preasignadas
        if (auth.user?.empresa_id) {
            setData(prev => ({
                ...prev,
                empresa_id: auth.user.empresa_id,
                sucursal_id: auth.user.sucursal_id || '',
                user_id: auth.user.id,
            }));
        }
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEditClick = (dep: Departamento) => {
        setEditingDepartamento(dep);
        setData({
            nombre:        dep.nombre || '',
            codigo:        dep.codigo || '',
            responsable:   dep.responsable || '',
            piso:          dep.piso || '',
            ubicacion:     dep.ubicacion || '',
            descripcion:   dep.descripcion || '',
            empresa_id:    dep.empresa_id,
            sucursal_id:   dep.sucursal_id,
            user_id:       dep.user_id,
            status:        dep.status,
            latitud:       dep.latitud ?? null,
            longitud:      dep.longitud ?? null,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDepartamento) {
            put(`/admin/departamentos/${editingDepartamento.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingDepartamento(null);
                    reset();
                    notifySuccess(__('Department updated successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/departamentos', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Department created successfully.'));
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (dep: Departamento) => {
        router.patch(`/admin/departamentos/${dep.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingDepartamento) return;
        router.delete(`/admin/departamentos/${deletingDepartamento.id}`, {
            onSuccess: () => {
                setDeletingDepartamento(null);
                notifySuccess(__('Department deleted successfully.'));
            },
            onError: () => notifyError(__('There was an error deleting the department. Please try again.')),
        });
    };

    const handleLocationSelected = (lat: number, lng: number, address?: string) => {
        setData((prev) => ({
            ...prev,
            latitud:  lat,
            longitud: lng,
            ...(address ? { ubicacion: address } : {}),
        }));
    };

    // ── Columnas de la tabla ───────────────────────────────────────────────────

    const columns: ColumnDef<Departamento>[] = [
        {
            header: 'Department',
            accessorKey: 'nombre',
            className: 'font-medium',
            cell: (dep) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">{dep.nombre}</p>
                        {dep.codigo && (
                            <p className="text-xs text-muted-foreground">{__('Code')}: {dep.codigo}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Company / Branch',
            hideOn: 'mobile',
            cell: (dep) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{dep.empresa?.razon_social ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{dep.sucursal?.nombre ?? '—'}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Details',
            hideOn: 'mobile',
            cell: (dep) => (
                <div className="space-y-0.5 text-xs text-muted-foreground">
                    {dep.responsable && (
                        <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            <span>{__('Responsible')}: {dep.responsable}</span>
                        </div>
                    )}
                    {dep.piso && (
                        <div className="flex items-center gap-1.5">
                            <Hash className="w-3 h-3" />
                            <span>{__('Floor')}: {dep.piso}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'System User',
            hideOn: 'mobile',
            cell: (dep) => (
                <span className="text-xs font-medium text-muted-foreground">
                    {dep.user?.name ?? '—'}
                </span>
            ),
        },
        {
            header: 'Status',
            stopRowClick: true,
            cell: (dep) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={dep.status === 1}
                        onCheckedChange={() => handleToggleStatus(dep)}
                    />
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        dep.status === 1
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}>
                        {dep.status === 1 ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (dep) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(dep)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(dep)}>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            {dep.status === 1 ? __('Deactivate') : __('Activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setDeletingDepartamento(dep)}
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
            <Head title={__('Departments')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Layers className="h-6 w-6 text-white" />}
                    title={__('Departments')}
                    description={__('Manage company departments, codes, building locations, and floor scopes.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('New Department')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        icon={<Layers className="h-6 w-6" />}
                        title={__('TOTAL DEPARTMENTS')}
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
                                placeholder={__('Search by name, code, responsible...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                        data={departamentos}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(dep) => handleEditClick(dep)}
                        emptyState={{
                            title: 'No departments found',
                            description: searchTerm || statusFilter
                                ? 'Try clearing your search filters or changing your query.'
                                : 'You have not registered any departments yet.',
                            ctaLabel: 'New Department',
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
                                {editingDepartamento ? __('Edit Department') : __('New Department')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Complete the department information across the available sections.')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                            <TabsList className="grid grid-cols-2 w-full mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
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
                                            onValueChange={(v) => {
                                                setData(prev => ({
                                                    ...prev,
                                                    empresa_id: v,
                                                    sucursal_id: '', // Reset sucursal on company change
                                                }));
                                            }}
                                        >
                                            <SelectTrigger id="empresa_id" className="w-full">
                                                <SelectValue placeholder={__('Select Company')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {empresas.map((emp) => (
                                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                                        {emp.razon_social}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.empresa_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>
                                        )}
                                    </div>

                                    {/* Sucursal */}
                                    <div>
                                        <Label htmlFor="sucursal_id">{__('Branch')} *</Label>
                                        <Select
                                            value={String(data.sucursal_id)}
                                            onValueChange={(v) => setData('sucursal_id', v)}
                                            disabled={!data.empresa_id}
                                        >
                                            <SelectTrigger id="sucursal_id" className="w-full">
                                                <SelectValue placeholder={data.empresa_id ? __('Select Branch') : __('Choose a company first')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredSucursales.map((suc) => (
                                                    <SelectItem key={suc.id} value={String(suc.id)}>
                                                        {suc.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.sucursal_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.sucursal_id}</p>
                                        )}
                                    </div>

                                    {/* Nombre */}
                                    <div>
                                        <Label htmlFor="nombre">{__('Department Name')} *</Label>
                                        <Input
                                            id="nombre"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            placeholder="Ej: Contabilidad y Finanzas"
                                        />
                                        {errors.nombre && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                                        )}
                                    </div>

                                    {/* Código */}
                                    <div>
                                        <Label htmlFor="codigo">{__('Department Code')}</Label>
                                        <Input
                                            id="codigo"
                                            value={data.codigo}
                                            onChange={(e) => setData('codigo', e.target.value)}
                                            placeholder="Ej: DEP-FIN-01"
                                        />
                                        {errors.codigo && (
                                            <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>
                                        )}
                                    </div>

                                    {/* Responsable (Nombre textual) */}
                                    <div>
                                        <Label htmlFor="responsable">{__('Responsible')}</Label>
                                        <Input
                                            id="responsable"
                                            value={data.responsable}
                                            onChange={(e) => setData('responsable', e.target.value)}
                                            placeholder="Ej: Carlos Mendoza"
                                        />
                                        {errors.responsable && (
                                            <p className="text-red-500 text-xs mt-1">{errors.responsable}</p>
                                        )}
                                    </div>

                                    {/* Piso */}
                                    <div>
                                        <Label htmlFor="piso">{__('Floor')}</Label>
                                        <Input
                                            id="piso"
                                            value={data.piso}
                                            onChange={(e) => setData('piso', e.target.value)}
                                            placeholder="Ej: Piso 3, Oficina 304"
                                        />
                                        {errors.piso && (
                                            <p className="text-red-500 text-xs mt-1">{errors.piso}</p>
                                        )}
                                    </div>

                                    {/* Usuario de Sistema */}
                                    <div>
                                        <Label htmlFor="user_id">{__('System User')} *</Label>
                                        <Select
                                            value={String(data.user_id)}
                                            onValueChange={(v) => setData('user_id', v)}
                                        >
                                            <SelectTrigger id="user_id" className="w-full">
                                                <SelectValue placeholder={__('Select User')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {usuarios.map((usr) => (
                                                    <SelectItem key={usr.id} value={String(usr.id)}>
                                                        {usr.name} ({usr.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && (
                                            <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <Label htmlFor="status">{__('Status')}</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="status"
                                                checked={data.status === 1}
                                                onCheckedChange={(checked) => setData('status', checked ? 1 : 0)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {data.status === 1 ? __('Active') : __('Inactive')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <div className="md:col-span-2">
                                        <Label htmlFor="descripcion">{__('Description')}</Label>
                                        <Textarea
                                            id="descripcion"
                                            value={data.descripcion}
                                            onChange={(e) => setData('descripcion', e.target.value)}
                                            placeholder={__('Enter brief description about the department functions...')}
                                            rows={3}
                                        />
                                        {errors.descripcion && (
                                            <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ══ Tab 2: Ubicación ══════════════════════════════════════════════════ */}
                            <TabsContent value="ubicacion" className="space-y-4">
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

                                <div>
                                    <Label htmlFor="ubicacion">{__('Location')}</Label>
                                    <Textarea
                                        id="ubicacion"
                                        value={data.ubicacion}
                                        onChange={(e) => setData('ubicacion', e.target.value)}
                                        placeholder={__('Specify office wings, coordinates, or click on the map...')}
                                        rows={2}
                                    />
                                    {errors.ubicacion && (
                                        <p className="text-red-500 text-xs mt-1">{errors.ubicacion}</p>
                                    )}
                                </div>

                                {/* Mapa */}
                                <div
                                    style={{ height: '350px', width: '100%' }}
                                    className="rounded-md overflow-hidden border flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                                >
                                    <Suspense
                                        fallback={
                                            <p className="text-slate-500 text-sm">{__('Loading map...')}</p>
                                        }
                                    >
                                        {isModalOpen && activeTab === 'ubicacion' && (
                                            <DepartamentoMapComponent
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
            <AlertDialog open={!!deletingDepartamento} onOpenChange={(open) => !open && setDeletingDepartamento(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('Delete Department')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Are you sure you want to delete this department?')}{' '}
                            <strong>{deletingDepartamento?.nombre}</strong>?{' '}
                            {__('This action cannot be undone.')}
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
