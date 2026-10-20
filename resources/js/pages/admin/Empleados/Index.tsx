import { Head, router, useForm } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    UserX,
    Percent,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Building2,
    Phone,
    Mail,
    Briefcase,
    DollarSign,
    MoreVertical,
    FileText,
    TrendingUp,
    Shield,
    Lock,
    ShoppingCart,
    Wrench,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useTranslate } from '@/hooks/use-translate';

interface Sucursal {
    id: number;
    nombre: string;
}

interface Usuario {
    id: number;
    name: string;
    email: string;
}

interface Empleado {
    id: number;
    empresa_id: number;
    sucursal_id: number | null;
    user_id: number | null;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    documento_tipo: string;
    documento_numero: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    cargo: string | null;
    sueldo_base: number;
    porcentaje_comision: number;
    tipo_comision: 'porcentaje' | 'monto_fijo';
    comision_aplica_a: 'subtotal' | 'total';
    porcentaje_comision_reparacion?: number;
    tipo_comision_reparacion?: 'porcentaje' | 'monto_fijo';
    comision_reparacion_aplica_a?: 'mano_obra' | 'total_orden';
    estado: boolean;
    fecha_ingreso: string | null;
    notas: string | null;
    sucursal?: Sucursal | null;
    user?: Usuario | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    empleados: PaginatedData<Empleado>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        promedio_comision: number;
    };
    sucursales: Sucursal[];
    roles: string[];
    filters: {
        search?: string;
        estado?: string;
        sucursal_id?: string;
        perPage?: number;
    };
}

export default function EmpleadosIndex({
    empleados,
    stats,
    sucursales = [],
    roles = ['Vendedor', 'Técnico', 'Administrador'],
    filters,
}: Props) {
    const { __ } = useTranslate();

    // Filtros
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedEstado, setSelectedEstado] = useState(filters.estado || 'all');
    const [selectedSucursal, setSelectedSucursal] = useState(filters.sucursal_id ? String(filters.sucursal_id) : 'all');

    // Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [empleadoToDelete, setEmpleadoToDelete] = useState<Empleado | null>(null);

    // Formulario
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nombres: '',
        apellidos: '',
        documento_tipo: 'DNI/CI',
        documento_numero: '',
        email: '',
        telefono: '',
        direccion: '',
        cargo: 'Vendedor',
        sueldo_base: '0.00',
        porcentaje_comision: '5.00',
        tipo_comision: 'porcentaje',
        comision_aplica_a: 'subtotal',
        porcentaje_comision_reparacion: '10.00',
        tipo_comision_reparacion: 'porcentaje',
        comision_reparacion_aplica_a: 'mano_obra',
        sucursal_id: sucursales.length > 0 ? String(sucursales[0].id) : '',
        crear_usuario: true,
        password: '',
        rol: 'Vendedor',
        estado: true,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        notas: '',
    });

    const openCreateModal = () => {
        setEditingEmpleado(null);
        reset();
        clearErrors();
        setData({
            nombres: '',
            apellidos: '',
            documento_tipo: 'DNI/CI',
            documento_numero: '',
            email: '',
            telefono: '',
            direccion: '',
            cargo: 'Vendedor',
            sueldo_base: '0.00',
            porcentaje_comision: '5.00',
            tipo_comision: 'porcentaje',
            comision_aplica_a: 'subtotal',
            porcentaje_comision_reparacion: '10.00',
            tipo_comision_reparacion: 'porcentaje',
            comision_reparacion_aplica_a: 'mano_obra',
            sucursal_id: sucursales.length > 0 ? String(sucursales[0].id) : '',
            crear_usuario: true,
            password: '',
            rol: 'Vendedor',
            estado: true,
            fecha_ingreso: new Date().toISOString().split('T')[0],
            notas: '',
        });
        setIsFormOpen(true);
    };

    const openEditModal = (emp: Empleado) => {
        setEditingEmpleado(emp);
        clearErrors();
        setData({
            nombres: emp.nombres || '',
            apellidos: emp.apellidos || '',
            documento_tipo: emp.documento_tipo || 'DNI/CI',
            documento_numero: emp.documento_numero || '',
            email: emp.email || '',
            telefono: emp.telefono || '',
            direccion: emp.direccion || '',
            cargo: emp.cargo || 'Vendedor',
            sueldo_base: String(emp.sueldo_base ?? 0),
            porcentaje_comision: String(emp.porcentaje_comision ?? 0),
            tipo_comision: emp.tipo_comision || 'porcentaje',
            comision_aplica_a: emp.comision_aplica_a || 'subtotal',
            porcentaje_comision_reparacion: String(emp.porcentaje_comision_reparacion ?? 0),
            tipo_comision_reparacion: emp.tipo_comision_reparacion || 'porcentaje',
            comision_reparacion_aplica_a: emp.comision_reparacion_aplica_a || 'mano_obra',
            sucursal_id: emp.sucursal_id ? String(emp.sucursal_id) : '',
            crear_usuario: Boolean(emp.user_id),
            password: '',
            rol: emp.user?.roles?.[0]?.name || (roles.includes('Técnico y Vendedor') && emp.cargo?.toLowerCase().includes('técnico') && emp.cargo?.toLowerCase().includes('vendedor') ? 'Técnico y Vendedor' : (emp.cargo?.toLowerCase().includes('técnico') ? 'Técnico' : 'Vendedor')),
            estado: Boolean(emp.estado),
            fecha_ingreso: emp.fecha_ingreso ? String(emp.fecha_ingreso).substring(0, 10) : '',
            notas: emp.notas || '',
        });
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmpleado) {
            put(`/admin/empleados/${editingEmpleado.id}`, {
                onSuccess: () => {
                    setIsFormOpen(false);
                    setEditingEmpleado(null);
                },
            });
        } else {
            post('/admin/empleados', {
                onSuccess: () => {
                    setIsFormOpen(false);
                },
            });
        }
    };

    const handleFilterChange = (params: { search?: string; estado?: string; sucursal_id?: string }) => {
        router.get('/admin/empleados', {
            search: params.search !== undefined ? params.search : searchTerm,
            estado: params.estado !== undefined ? params.estado : selectedEstado,
            sucursal_id: params.sucursal_id !== undefined ? params.sucursal_id : selectedSucursal,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (emp: Empleado) => {
        router.patch(`/admin/empleados/${emp.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const confirmDelete = () => {
        if (!empleadoToDelete) return;
        router.delete(`/admin/empleados/${empleadoToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setEmpleadoToDelete(null);
            },
        });
    };

    const breadcrumbs = [
        { title: __('Administración'), href: '/admin/dashboard' },
        { title: __('Empleados & Vendedores'), href: '/admin/empleados' },
    ];

    return (
        <>
            <Head title={__('Gestión de Empleados & Comisiones')} />

            <div className="space-y-6">
                {/* Migas de pan y Cabecera */}
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Empleados & Equipo de Ventas')}
                    description={__('Administra el personal, sus datos personales, asignación de sucursal y porcentajes de comisiones por ventas.')}
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => router.get('/admin/comisiones')}
                            className="gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            {__('Ver Módulo de Comisiones')}
                        </Button>
                        <Button onClick={openCreateModal} className="gap-2 bg-white text-emerald-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-emerald-400 font-semibold shadow-sm">
                            <Plus className="h-4 w-4" />
                            {__('Nuevo Empleado')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* Tarjetas de Estadísticas */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={__('Total Empleados')}
                        value={stats.total}
                        icon={<Users className="h-6 w-6" />}
                        colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        description={__('Registrados en el sistema')}
                    />
                    <StatCard
                        title={__('Empleados Activos')}
                        value={stats.activos}
                        icon={<UserCheck className="h-6 w-6" />}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        className="border-emerald-500/20"
                        description={__('Habilitados para vender y comisionar')}
                    />
                    <StatCard
                        title={__('Inactivos')}
                        value={stats.inactivos}
                        icon={<UserX className="h-6 w-6" />}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        className="border-amber-500/20"
                        description={__('Personal en pausa o retirado')}
                    />
                    <StatCard
                        title={__('Comisión Promedio')}
                        value={`${stats.promedio_comision}%`}
                        icon={<Percent className="h-6 w-6" />}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        className="border-blue-500/20"
                        description={__('Tasa promedio sobre ventas')}
                    />
                </div>

                {/* Barra de Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={__('Buscar por nombre, documento, teléfono, cargo...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search: searchTerm })}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {sucursales.length > 0 && (
                            <Select
                                value={selectedSucursal}
                                onValueChange={(val) => {
                                    setSelectedSucursal(val);
                                    handleFilterChange({ sucursal_id: val });
                                }}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <Building2 className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder={__('Sucursal')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todas las sucursales')}</SelectItem>
                                    {sucursales.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select
                            value={selectedEstado}
                            onValueChange={(val) => {
                                setSelectedEstado(val);
                                handleFilterChange({ estado: val });
                            }}
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder={__('Estado')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos')}</SelectItem>
                                <SelectItem value="1">{__('Activos')}</SelectItem>
                                <SelectItem value="0">{__('Inactivos')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="secondary"
                            onClick={() => handleFilterChange({ search: searchTerm })}
                            className="font-medium"
                        >
                            {__('Filtrar')}
                        </Button>
                    </div>
                </div>

                {/* Tabla de Empleados */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                <tr>
                                    <th className="px-5 py-3.5">{__('Empleado')}</th>
                                    <th className="px-5 py-3.5">{__('Contacto')}</th>
                                    <th className="px-5 py-3.5">{__('Cargo / Sucursal')}</th>
                                    <th className="px-5 py-3.5">{__('Comisión Ventas')}</th>
                                    <th className="px-5 py-3.5">{__('Sueldo Base')}</th>
                                    <th className="px-5 py-3.5 text-center">{__('Estado')}</th>
                                    <th className="px-5 py-3.5 text-right">{__('Acciones')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {empleados.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Users className="mx-auto h-10 w-10 stroke-1 mb-2 opacity-50" />
                                            <p className="font-medium">{__('No se encontraron empleados registrados.')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {__('Haz clic en "Nuevo Empleado" para registrar tu primer miembro de equipo.')}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    empleados.data.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Empleado */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                                                        {(emp.nombres[0] || '').toUpperCase()}
                                                        {(emp.apellidos[0] || '').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                            {emp.nombre_completo}
                                                            {emp.user_id && (
                                                                <span
                                                                    title={emp.user?.email ? __('Acceso al sistema: :email', { email: emp.user.email }) : __('Usuario de acceso activado')}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-full border border-blue-500/20"
                                                                >
                                                                    <Shield className="h-3 w-3" />
                                                                    {__('Acceso')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {emp.documento_numero && (
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {emp.documento_tipo}: {emp.documento_numero}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contacto */}
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5 text-xs">
                                                    {emp.telefono && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{emp.telefono}</span>
                                                        </div>
                                                    )}
                                                    {emp.email && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{emp.email}</span>
                                                        </div>
                                                    )}
                                                    {!emp.telefono && !emp.email && (
                                                        <span className="text-muted-foreground italic">{__('Sin contacto')}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Cargo / Sucursal */}
                                            <td className="px-5 py-3.5">
                                                <div className="font-medium text-xs text-foreground flex items-center gap-1">
                                                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {emp.cargo || __('Vendedor')}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                                    {emp.sucursal?.nombre || __('Todas las sucursales')}
                                                </div>
                                            </td>

                                            {/* Comisión */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-bold text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/20"
                                                        title={emp.comision_aplica_a === 'total' ? __('Ventas (Sobre Total)') : __('Ventas (Sobre Subtotal)')}
                                                    >
                                                        <ShoppingCart className="h-3 w-3 mr-1 text-emerald-600" />
                                                        {Number(emp.porcentaje_comision).toFixed(1)}% {__('Ventas')}
                                                    </Badge>
                                                    {Number(emp.porcentaje_comision_reparacion || 0) > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="font-bold text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-500/20"
                                                            title={emp.comision_reparacion_aplica_a === 'total_orden' ? __('Taller (Sobre Total Orden)') : __('Taller (Sobre Mano de Obra)')}
                                                        >
                                                            <Wrench className="h-3 w-3 mr-1 text-indigo-600" />
                                                            {Number(emp.porcentaje_comision_reparacion).toFixed(1)}% {__('Taller')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Sueldo Base */}
                                            <td className="px-5 py-3.5 font-medium text-foreground">
                                                {emp.sueldo_base > 0 ? (
                                                    `$${Number(emp.sueldo_base).toFixed(2)}`
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">{__('Solo comisión')}</span>
                                                )}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(emp)}
                                                    className="inline-flex cursor-pointer focus:outline-none"
                                                    title={emp.estado ? __('Click para desactivar') : __('Click para activar')}
                                                >
                                                    {emp.estado ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            {__('Activo')}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground border-border hover:bg-muted">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            {__('Inactivo')}
                                                        </Badge>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-5 py-3.5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>{__('Acciones')}</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => router.get(`/admin/comisiones?empleado_id=${emp.id}`)}
                                                            className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                                                        >
                                                            <TrendingUp className="h-4 w-4" />
                                                            {__('Ver Comisiones')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => openEditModal(emp)}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Edit2 className="h-4 w-4 text-blue-500" />
                                                            {__('Editar Datos')}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEmpleadoToDelete(emp);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            {__('Eliminar')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {empleados.last_page > 1 && (
                        <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
                            <div>
                                {__('Mostrando')} <span className="font-semibold">{empleados.data.length}</span> {__('de')}{' '}
                                <span className="font-semibold">{empleados.total}</span> {__('empleados')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!empleados.prev_page_url}
                                    onClick={() => empleados.prev_page_url && router.get(empleados.prev_page_url)}
                                >
                                    {__('Anterior')}
                                </Button>
                                <span className="font-medium text-foreground">
                                    {empleados.current_page} / {empleados.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!empleados.next_page_url}
                                    onClick={() => empleados.next_page_url && router.get(empleados.next_page_url)}
                                >
                                    {__('Siguiente')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Registro / Edición de Empleado */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="w-[96vw] max-w-6xl xl:max-w-7xl sm:max-w-6xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl shadow-2xl border-border/80 bg-card">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        {/* Header Fijo */}
                        <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                            <span>{editingEmpleado ? __('Editar Información del Empleado') : __('Registrar Nuevo Empleado')}</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            {__('Configura los datos personales, cargo, reglas de comisiones por venta y credenciales de acceso al sistema.')}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {editingEmpleado ? (
                                        <Badge variant="outline" className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-xs font-semibold">
                                            {__('ID Empleado: #')}{editingEmpleado.id}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-semibold">
                                            {__('Nuevo Colaborador')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Body con Scroll Independiente y 2 Columnas Grandes en Desktop */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {/* COLUMNA IZQUIERDA */}
                                <div className="space-y-6">
                                    {/* SECCIÓN 1: DATOS PERSONALES Y CONTACTO */}
                                    <div className="border rounded-2xl p-5 sm:p-6 bg-card shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div className="font-bold text-sm tracking-wide text-foreground flex items-center gap-2.5">
                                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                    <UserCheck className="h-4 w-4" />
                                                </div>
                                                <span>{__('Datos Personales & Contacto')}</span>
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">
                                                {__('Identificación del colaborador')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="nombres" className="font-semibold">{__('Nombres')} *</Label>
                                                <Input
                                                    id="nombres"
                                                    required
                                                    placeholder={__('Ej. Carlos Alberto')}
                                                    value={data.nombres}
                                                    onChange={(e) => setData('nombres', e.target.value)}
                                                    className="h-10"
                                                />
                                                {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="apellidos" className="font-semibold">{__('Apellidos')} *</Label>
                                                <Input
                                                    id="apellidos"
                                                    required
                                                    placeholder={__('Ej. Martínez Silva')}
                                                    value={data.apellidos}
                                                    onChange={(e) => setData('apellidos', e.target.value)}
                                                    className="h-10"
                                                />
                                                {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="documento_tipo">{__('Tipo de Documento')}</Label>
                                                <Select
                                                    value={data.documento_tipo}
                                                    onValueChange={(val) => setData('documento_tipo', val)}
                                                >
                                                    <SelectTrigger id="documento_tipo" className="h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="DNI/CI">DNI / Cédula</SelectItem>
                                                        <SelectItem value="RUT/RFC">RUT / RFC</SelectItem>
                                                        <SelectItem value="Pasaporte">{__('Pasaporte')}</SelectItem>
                                                        <SelectItem value="Otro">{__('Otro')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="documento_numero">{__('Número de Documento')}</Label>
                                                <Input
                                                    id="documento_numero"
                                                    placeholder={__('Ej. 12345678')}
                                                    value={data.documento_numero}
                                                    onChange={(e) => setData('documento_numero', e.target.value)}
                                                    className="h-10"
                                                />
                                                {errors.documento_numero && <p className="text-xs text-destructive">{errors.documento_numero}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="telefono">{__('Teléfono / WhatsApp')}</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="telefono"
                                                        className="pl-9 h-10"
                                                        placeholder={__('+58 412 1234567')}
                                                        value={data.telefono}
                                                        onChange={(e) => setData('telefono', e.target.value)}
                                                    />
                                                </div>
                                                {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="email">{__('Correo Electrónico')}</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        className="pl-9 h-10"
                                                        placeholder={__('empleado@correo.com')}
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                    />
                                                </div>
                                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                            </div>

                                            <div className="space-y-1.5 sm:col-span-2">
                                                <Label htmlFor="direccion">{__('Dirección de Residencia')}</Label>
                                                <Input
                                                    id="direccion"
                                                    placeholder={__('Calle, sector, edificio o ciudad de residencia...')}
                                                    value={data.direccion}
                                                    onChange={(e) => setData('direccion', e.target.value)}
                                                    className="h-10"
                                                />
                                                {errors.direccion && <p className="text-xs text-destructive">{errors.direccion}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 2: CUENTA DE ACCESO AL SISTEMA (USUARIO) */}
                                    <div className="border rounded-2xl p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-foreground block">
                                                        {__('Cuenta de Acceso al Sistema (Usuario)')}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">
                                                        {__('Permite al colaborador iniciar sesión en la terminal POS y panel')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={data.crear_usuario}
                                                onCheckedChange={(checked) => setData('crear_usuario', checked)}
                                            />
                                        </div>

                                        {data.crear_usuario ? (
                                            <div className="space-y-4 pt-1">
                                                {editingEmpleado?.user ? (
                                                    <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-xl text-xs">
                                                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        <div>
                                                            <span className="font-bold">{__('Usuario vinculado activo:')}</span>{' '}
                                                            <span className="font-mono">{editingEmpleado.user.email}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/20 flex items-start gap-2">
                                                        <span className="text-base shrink-0">💡</span>
                                                        <p>
                                                            {__('Se generará automáticamente una cuenta de usuario vinculada con el correo ingresado en los datos personales.')}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="password">
                                                            {editingEmpleado?.user ? __('Nueva Contraseña (Opcional)') : __('Contraseña de Acceso')}
                                                        </Label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                id="password"
                                                                type="password"
                                                                placeholder={editingEmpleado?.user ? __('Dejar en blanco para conservar') : __('Por defecto: 12345678')}
                                                                className="pl-9 h-10"
                                                                value={data.password}
                                                                onChange={(e) => setData('password', e.target.value)}
                                                            />
                                                        </div>
                                                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="rol">{__('Rol de Permisos')}</Label>
                                                        <Select
                                                            value={data.rol}
                                                            onValueChange={(val) => setData('rol', val)}
                                                        >
                                                            <SelectTrigger id="rol" className="h-10">
                                                                <SelectValue placeholder={__('Selecciona un rol')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {roles.map((r) => (
                                                                    <SelectItem key={r} value={r}>
                                                                        {r}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.rol && <p className="text-xs text-destructive">{errors.rol}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic py-1">
                                                {__('Este empleado no tendrá credenciales de inicio de sesión en el sistema (solo comisionará si se selecciona en la terminal POS).')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA DERECHA */}
                                <div className="space-y-6">
                                    {/* SECCIÓN 3: REGLAS DE COMISIONES Y ASIGNACIÓN LABORAL */}
                                    <div className="border rounded-2xl p-5 sm:p-6 bg-card shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div className="font-bold text-sm tracking-wide text-foreground flex items-center gap-2.5">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <span>{__('Comisiones por Ventas & Asignación Laboral')}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                {__('Reglas de liquidación')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cargo">{__('Cargo / Puesto')}</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="cargo"
                                                        className="pl-9 h-10"
                                                        placeholder={__('Ej. Vendedor Senior')}
                                                        value={data.cargo}
                                                        onChange={(e) => setData('cargo', e.target.value)}
                                                    />
                                                </div>
                                                {errors.cargo && <p className="text-xs text-destructive">{errors.cargo}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="sucursal_id">{__('Sucursal Asignada')}</Label>
                                                <Select
                                                    value={data.sucursal_id || 'none'}
                                                    onValueChange={(val) => setData('sucursal_id', val === 'none' ? '' : val)}
                                                >
                                                    <SelectTrigger id="sucursal_id" className="h-10">
                                                        <SelectValue placeholder={__('Selecciona sucursal')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{__('Todas las sucursales')}</SelectItem>
                                                        {sucursales.map((s) => (
                                                            <SelectItem key={s.id} value={String(s.id)}>
                                                                {s.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5 sm:col-span-2 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="porcentaje_comision" className="text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between">
                                                            <span>{__('% Comisión Ventas')} *</span>
                                                            <span className="text-[10px] font-normal text-muted-foreground">{__('Tasa ganada por ticket')}</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="porcentaje_comision"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                required
                                                                className="pr-9 h-11 text-lg font-black text-emerald-700 dark:text-emerald-300 bg-card border-emerald-500/30"
                                                                value={data.porcentaje_comision}
                                                                onChange={(e) => setData('porcentaje_comision', e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-black text-base">
                                                                %
                                                            </span>
                                                        </div>
                                                        {errors.porcentaje_comision && <p className="text-xs text-destructive">{errors.porcentaje_comision}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="comision_aplica_a" className="font-semibold text-foreground">
                                                            {__('Base de Cálculo de Comisión')}
                                                        </Label>
                                                        <Select
                                                            value={data.comision_aplica_a}
                                                            onValueChange={(val: any) => setData('comision_aplica_a', val)}
                                                        >
                                                            <SelectTrigger id="comision_aplica_a" className="h-11 bg-card">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="subtotal">{__('Subtotal (Sin impuestos)')}</SelectItem>
                                                                <SelectItem value="total">{__('Total Final (Con impuestos)')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {data.comision_aplica_a === 'subtotal' ? __('Se calcula antes de aplicar IVA/impuestos.') : __('Se calcula sobre el monto total cobrado.')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 sm:col-span-2 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="porcentaje_comision_reparacion" className="text-indigo-800 dark:text-indigo-200 font-bold flex items-center justify-between">
                                                            <span>{__('% Comisión Taller / Reparaciones')}</span>
                                                            <span className="text-[10px] font-normal text-muted-foreground">{__('Tasa ganada por reparación')}</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="porcentaje_comision_reparacion"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                className="pr-9 h-11 text-lg font-black text-indigo-700 dark:text-indigo-300 bg-card border-indigo-500/30"
                                                                value={data.porcentaje_comision_reparacion}
                                                                onChange={(e) => setData('porcentaje_comision_reparacion', e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 font-black text-base">
                                                                %
                                                            </span>
                                                        </div>
                                                        {errors.porcentaje_comision_reparacion && <p className="text-xs text-destructive">{errors.porcentaje_comision_reparacion}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="comision_reparacion_aplica_a" className="font-semibold text-foreground">
                                                            {__('Base de Cálculo Taller')}
                                                        </Label>
                                                        <Select
                                                            value={data.comision_reparacion_aplica_a}
                                                            onValueChange={(val: any) => setData('comision_reparacion_aplica_a', val)}
                                                        >
                                                            <SelectTrigger id="comision_reparacion_aplica_a" className="h-11 bg-card">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="mano_obra">{__('Solo Mano de Obra (Recomendado)')}</SelectItem>
                                                                <SelectItem value="total_orden">{__('Total de la Orden')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {data.comision_reparacion_aplica_a === 'mano_obra' ? __('Se calcula únicamente sobre el valor del trabajo técnico.') : __('Se calcula sobre el valor total incluyendo repuestos.')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="sueldo_base">{__('Sueldo Base Mensual ($)')}</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="sueldo_base"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="pl-9 h-10 font-medium"
                                                        value={data.sueldo_base}
                                                        onChange={(e) => setData('sueldo_base', e.target.value)}
                                                    />
                                                </div>
                                                {errors.sueldo_base && <p className="text-xs text-destructive">{errors.sueldo_base}</p>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="fecha_ingreso">{__('Fecha de Ingreso')}</Label>
                                                <Input
                                                    id="fecha_ingreso"
                                                    type="date"
                                                    className="h-10"
                                                    value={data.fecha_ingreso || ''}
                                                    onChange={(e) => setData('fecha_ingreso', e.target.value)}
                                                />
                                                {errors.fecha_ingreso && <p className="text-xs text-destructive">{errors.fecha_ingreso}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN 4: ESTADO Y OBSERVACIONES */}
                                    <div className="border rounded-2xl p-5 sm:p-6 bg-card shadow-xs space-y-4">
                                        <div className="flex items-center justify-between border-b pb-3">
                                            <div>
                                                <Label htmlFor="estado" className="font-bold text-sm cursor-pointer block text-foreground">
                                                    {__('Estado del Empleado')}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {data.estado ? __('Activo: Habilitado para vender y comisionar.') : __('Inactivo: En pausa o retirado del equipo.')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={data.estado ? 'default' : 'secondary'} className={data.estado ? 'bg-emerald-600' : ''}>
                                                    {data.estado ? __('Activo') : __('Inactivo')}
                                                </Badge>
                                                <Switch
                                                    id="estado"
                                                    checked={data.estado}
                                                    onCheckedChange={(checked) => setData('estado', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="notas">{__('Notas Adicionales u Observaciones')}</Label>
                                            <Textarea
                                                id="notas"
                                                rows={3}
                                                placeholder={__('Condiciones especiales, metas acordadas, contactos de emergencia o notas internas...')}
                                                value={data.notas}
                                                onChange={(e) => setData('notas', e.target.value)}
                                            />
                                            {errors.notas && <p className="text-xs text-destructive">{errors.notas}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Fijo */}
                        <DialogFooter className="p-4 sm:px-8 border-t bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                                {__('Los campos marcados con (*) son obligatorios.')}
                            </span>
                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsFormOpen(false)}
                                    disabled={processing}
                                    className="px-5"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2 px-7 bg-primary font-semibold shadow-xs">
                                    {processing ? __('Guardando...') : (editingEmpleado ? __('Actualizar Empleado') : __('Guardar Empleado'))}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmación de Eliminación */}
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={__('¿Eliminar empleado?')}
                description={__('Si el empleado :nombre ya tiene ventas o comisiones registradas en el sistema, será desactivado para preservar el historial comercial.', {
                    nombre: empleadoToDelete?.nombre_completo || '',
                })}
            />
        </>
    );
}
