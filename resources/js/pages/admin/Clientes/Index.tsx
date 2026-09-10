import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    Phone,
    Briefcase,
    ShieldAlert,
    ExternalLink,
    Eye,
    Edit2,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { useTranslate } from '@/hooks/use-translate';

interface Cliente {
    id: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    email?: string | null;
    telefono_principal: string;
    telefono_secundario?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    empresa_trabajo?: string | null;
    cargo_trabajo?: string | null;
    ingreso_mensual?: string | number | null;
    dia_pago?: string | null;
    limite_credito: string | number;
    estado_crediticio: 'activo' | 'en_evaluacion' | 'moroso' | 'bloqueado';
    creditos_activos_count?: number;
    observaciones?: string | null;
}

interface Props {
    clientes: Paginated<Cliente>;
    stats: {
        total: number;
        activos: number;
        en_evaluacion: number;
        morosos: number;
    };
    filters: {
        search?: string;
        estado_crediticio?: string;
        perPage?: number;
    };
}

export default function ClientesIndex({ clientes, stats, filters }: Props) {
    const { __ } = useTranslate();
    const { regional_config } = usePage().props as any;
    const currency = regional_config?.currency_symbol || '$';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    const [search, setSearch] = useState(filters.search || '');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado_crediticio || 'all');

    const form = useForm({
        nombres: '',
        apellidos: '',
        tipo_documento: 'V',
        numero_documento: '',
        email: '',
        telefono_principal: '',
        telefono_secundario: '',
        direccion: '',
        ciudad: '',
        empresa_trabajo: '',
        cargo_trabajo: '',
        ingreso_mensual: '',
        dia_pago: 'quincenal',
        limite_credito: '500',
        estado_crediticio: 'activo',
        observaciones: '',
    });

    const handleFilterChange = (overrideParams = {}) => {
        const params = {
            search: search || undefined,
            estado_crediticio: estadoFilter !== 'all' ? estadoFilter : undefined,
            ...overrideParams,
        };
        router.get(window.location.pathname, cleanParams(params), { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditingCliente(null);
        form.reset();
        form.setData({
            nombres: '',
            apellidos: '',
            tipo_documento: 'V',
            numero_documento: '',
            email: '',
            telefono_principal: '',
            telefono_secundario: '',
            direccion: '',
            ciudad: '',
            empresa_trabajo: '',
            cargo_trabajo: '',
            ingreso_mensual: '',
            dia_pago: 'quincenal',
            limite_credito: '500',
            estado_crediticio: 'activo',
            observaciones: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (cliente: Cliente) => {
        setEditingCliente(cliente);
        form.setData({
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            tipo_documento: cliente.tipo_documento,
            numero_documento: cliente.numero_documento,
            email: cliente.email || '',
            telefono_principal: cliente.telefono_principal,
            telefono_secundario: cliente.telefono_secundario || '',
            direccion: cliente.direccion || '',
            ciudad: cliente.ciudad || '',
            empresa_trabajo: cliente.empresa_trabajo || '',
            cargo_trabajo: cliente.cargo_trabajo || '',
            ingreso_mensual: cliente.ingreso_mensual ? cliente.ingreso_mensual.toString() : '',
            dia_pago: cliente.dia_pago || 'quincenal',
            limite_credito: cliente.limite_credito ? cliente.limite_credito.toString() : '500',
            estado_crediticio: cliente.estado_crediticio,
            observaciones: cliente.observaciones || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCliente) {
            form.put(`/admin/clientes/${editingCliente.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/admin/clientes', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de eliminar este cliente?'))) {
            router.delete(`/admin/clientes/${id}`);
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">{__('Aprobado / Activo')}</Badge>;
            case 'en_evaluacion':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">{__('En Evaluación')}</Badge>;
            case 'moroso':
                return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20">{__('En Mora')}</Badge>;
            case 'bloqueado':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20">{__('Bloqueado')}</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    const columns: ColumnDef<Cliente>[] = [
        {
            header: __('Cliente'),
            accessorKey: 'nombres',
            sortable: true,
            cell: (c) => (
                <div className="font-medium">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {c.nombres} {c.apellidos}
                    </div>
                    <div className="text-xs text-slate-500">
                        {c.email || __('Sin correo')}
                    </div>
                </div>
            ),
        },
        {
            header: __('Documento'),
            accessorKey: 'numero_documento',
            sortable: true,
            cell: (c) => (
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {c.tipo_documento}-{c.numero_documento}
                </span>
            ),
        },
        {
            header: __('Contacto / WhatsApp'),
            hideOn: 'mobile',
            cell: (c) => (
                <div>
                    <a
                        href={`https://wa.me/${c.telefono_principal.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                        <Phone className="size-3" /> {c.telefono_principal}
                        <ExternalLink className="size-2.5" />
                    </a>
                    {c.ciudad && <div className="text-xs text-slate-400">{c.ciudad}</div>}
                </div>
            ),
        },
        {
            header: __('Datos Laborales'),
            hideOn: 'tablet',
            cell: (c) => (
                <div className="text-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                        {c.empresa_trabajo || __('No especificada')}
                    </div>
                    <div className="text-slate-500">{c.cargo_trabajo || __('Cliente particular')}</div>
                </div>
            ),
        },
        {
            header: __('Límite Crédito'),
            accessorKey: 'limite_credito',
            sortable: true,
            cell: (c) => (
                <span className="font-bold text-slate-900 dark:text-slate-100">
                    {currency}{Number(c.limite_credito).toFixed(2)}
                </span>
            ),
        },
        {
            header: __('Créditos'),
            cell: (c) => (
                c.creditos_activos_count && c.creditos_activos_count > 0 ? (
                    <Badge variant="secondary" className="font-mono">
                        {c.creditos_activos_count} {__('activo(s)')}
                    </Badge>
                ) : (
                    <span className="text-xs text-slate-400">{__('Sin créditos')}</span>
                )
            ),
        },
        {
            header: __('Estado'),
            accessorKey: 'estado_crediticio',
            sortable: true,
            cell: (c) => getEstadoBadge(c.estado_crediticio),
        },
        {
            header: __('Acciones'),
            className: 'text-right',
            stopRowClick: true,
            hideable: false,
            cell: (c) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/admin/clientes/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" title={__('Ver Expediente')}>
                            <Eye className="size-3.5" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(c)}
                        className="h-8 w-8 p-0"
                        title={__('Editar')}
                    >
                        <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                        title={__('Eliminar')}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Head title={__('Directorio de Clientes')} />

            <Breadcrumbs
                breadcrumbs={[
                    { title: __('Dashboard'), href: '/admin/dashboard' },
                    { title: __('Clientes'), href: '/admin/clientes' },
                ]}
            />

            {/* Header */}
            <ModuleHeader
                icon={<Users className="size-6 sm:size-7" />}
                title={__('Clientes & Evaluación Crediticia')}
                description={__('Gestión del expediente de clientes, verificación de ingresos laborales, límite de crédito y scoring de riesgo.')}
                colorClassName="bg-blue-600 dark:bg-blue-700"
            >
                <Button onClick={openCreateModal} className="bg-white text-blue-700 hover:bg-slate-100 font-semibold">
                    <UserPlus className="size-4 mr-1.5" /> {__('Registrar Cliente')}
                </Button>
            </ModuleHeader>

            {/* Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="size-5 text-blue-600" />}
                    title={__('Total Clientes')}
                    value={stats.total}
                    colorClassName="bg-blue-50 dark:bg-blue-950/40"
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5 text-emerald-600" />}
                    title={__('Aprobados / Activos')}
                    value={stats.activos}
                    colorClassName="bg-emerald-50 dark:bg-emerald-950/40"
                />
                <StatCard
                    icon={<Clock className="size-5 text-amber-600" />}
                    title={__('En Evaluación')}
                    value={stats.en_evaluacion}
                    colorClassName="bg-amber-50 dark:bg-amber-950/40"
                />
                <StatCard
                    icon={<ShieldAlert className="size-5 text-rose-600" />}
                    title={__('Con Morosidad')}
                    value={stats.morosos}
                    colorClassName="bg-rose-50 dark:bg-rose-950/40"
                />
            </div>

            {/* Filtros */}
            <FilterBar>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder={__('Buscar por nombre, documento o teléfono...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            className="pl-9 h-10"
                        />
                    </div>

                    <Select value={estadoFilter} onValueChange={(val) => { setEstadoFilter(val); handleFilterChange({ estado_crediticio: val !== 'all' ? val : undefined }); }}>
                        <SelectTrigger className="w-full sm:w-[220px] md:w-[260px] h-10">
                            <SelectValue placeholder={__('Estado crediticio')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{__('Todos los estados')}</SelectItem>
                            <SelectItem value="activo">{__('Aprobado / Activo')}</SelectItem>
                            <SelectItem value="en_evaluacion">{__('En Evaluación')}</SelectItem>
                            <SelectItem value="moroso">{__('En Mora')}</SelectItem>
                            <SelectItem value="bloqueado">{__('Bloqueado')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="secondary" onClick={() => handleFilterChange()} className="h-10">
                        <Filter className="size-4 mr-1.5" /> {__('Filtrar')}
                    </Button>
                </div>
            </FilterBar>

            {/* DataTable Reutilizable */}
            <DataTable
                data={clientes}
                columns={columns}
                filters={filters as any}
                emptyMessage={__('No se encontraron clientes registrados con los filtros aplicados.')}
            />

            {/* Modal para Crear / Editar Cliente */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCliente ? __('Editar Cliente') : __('Registrar Nuevo Cliente')}</DialogTitle>
                        <DialogDescription>
                            {__('Completa los datos personales, de contacto y laborales para el expediente crediticio.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{__('Nombres')} *</Label>
                                <Input
                                    required
                                    placeholder={__('Ej. Roberto Carlos')}
                                    value={form.data.nombres}
                                    onChange={(e) => form.setData('nombres', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{__('Apellidos')} *</Label>
                                <Input
                                    required
                                    placeholder={__('Ej. Pérez Gómez')}
                                    value={form.data.apellidos}
                                    onChange={(e) => form.setData('apellidos', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>{__('Tipo Doc.')} *</Label>
                                <Select
                                    value={form.data.tipo_documento}
                                    onValueChange={(val) => form.setData('tipo_documento', val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="V">V ({__('Venezolano')})</SelectItem>
                                        <SelectItem value="E">E ({__('Extranjero')})</SelectItem>
                                        <SelectItem value="J">J ({__('Jurídico')})</SelectItem>
                                        <SelectItem value="DNI">DNI / INE</SelectItem>
                                        <SelectItem value="PAS">{__('Pasaporte')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>{__('Número de Documento')} *</Label>
                                <Input
                                    required
                                    placeholder="Ej. 25123456"
                                    value={form.data.numero_documento}
                                    onChange={(e) => form.setData('numero_documento', e.target.value)}
                                />
                                {form.errors.numero_documento && <p className="text-xs text-rose-500">{form.errors.numero_documento}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{__('Teléfono Principal (WhatsApp)')} *</Label>
                                <Input
                                    required
                                    placeholder="Ej. +58 412 1234567"
                                    value={form.data.telefono_principal}
                                    onChange={(e) => form.setData('telefono_principal', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{__('Teléfono Secundario / Casa')}</Label>
                                <Input
                                    placeholder={__('Opcional')}
                                    value={form.data.telefono_secundario}
                                    onChange={(e) => form.setData('telefono_secundario', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{__('Correo Electrónico')}</Label>
                                <Input
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>{__('Ciudad / Municipio')}</Label>
                                <Input
                                    placeholder={__('Ej. Caracas, Valencia, etc.')}
                                    value={form.data.ciudad}
                                    onChange={(e) => form.setData('ciudad', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>{__('Dirección Residencial')}</Label>
                            <Textarea
                                placeholder={__('Calle, edificio, casa, punto de referencia...')}
                                value={form.data.direccion}
                                onChange={(e) => form.setData('direccion', e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Datos Laborales */}
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Briefcase className="size-3.5" /> {__('Información Laboral e Ingresos')}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>{__('Empresa / Empleador')}</Label>
                                    <Input
                                        placeholder={__('Nombre de la empresa')}
                                        value={form.data.empresa_trabajo}
                                        onChange={(e) => form.setData('empresa_trabajo', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Cargo / Ocupación')}</Label>
                                    <Input
                                        placeholder={__('Ej. Asistente administrativo')}
                                        value={form.data.cargo_trabajo}
                                        onChange={(e) => form.setData('cargo_trabajo', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label>{__('Ingreso Mensual')} ({currency})</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.data.ingreso_mensual}
                                        onChange={(e) => form.setData('ingreso_mensual', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Frecuencia de Cobro')}</Label>
                                    <Select
                                        value={form.data.dia_pago}
                                        onValueChange={(val) => form.setData('dia_pago', val)}
                                    >
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="semanal">{__('Semanal')}</SelectItem>
                                            <SelectItem value="quincenal">{__('Quincenal')}</SelectItem>
                                            <SelectItem value="mensual">{__('Mensual')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Límite de Crédito')} ({currency}) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={form.data.limite_credito}
                                        onChange={(e) => form.setData('limite_credito', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {editingCliente && (
                            <div className="space-y-1.5">
                                <Label>{__('Estado Crediticio')}</Label>
                                <Select
                                    value={form.data.estado_crediticio}
                                    onValueChange={(val: any) => form.setData('estado_crediticio', val)}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="activo">{__('Aprobado / Activo')}</SelectItem>
                                        <SelectItem value="en_evaluacion">{__('En Evaluación')}</SelectItem>
                                        <SelectItem value="moroso">{__('En Mora')}</SelectItem>
                                        <SelectItem value="bloqueado">{__('Bloqueado')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>{__('Observaciones Crediticias / Referencias')}</Label>
                            <Textarea
                                placeholder={__('Notas internas sobre capacidad de pago, historial, avales...')}
                                value={form.data.observaciones}
                                onChange={(e) => form.setData('observaciones', e.target.value)}
                                rows={2}
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={form.processing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {form.processing ? __('Guardando...') : __('Guardar Cliente')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

