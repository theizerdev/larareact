import { Head, useForm, router } from '@inertiajs/react';
import {
    Stethoscope,
    UserPlus,
    User,
    Phone,
    Mail,
    MoreVertical,
    Pencil,
    ToggleRight,
    MessageCircle,
    CheckCircle,
    Activity,
    Plus,
    Trash2,
    Calendar,
    Award,
    Building2,
    Shield,
    BadgeCheck,
    Palette,
    FileText,
    Check,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import PhoneInputGroup, { type PaisPhoneOption } from '../Empresas/Partials/PhoneInputGroup';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
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

interface EspecialidadItem {
    id: number;
    nombre: string;
    icono?: string | null;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
}

interface Medico {
    id: number;
    codigo_medico: string;
    nombres: string;
    apellidos: string;
    documento_identidad: string | null;
    licencia_medica: string | null;
    tipo_licencia: string | null;
    pais_telefono_id?: number | null;
    telefono: string | null;
    email: string | null;
    especialidad_principal_id?: number | null;
    especialidad_principal?: EspecialidadItem | null;
    especialidades?: EspecialidadItem[];
    user_id?: number | null;
    user?: UserItem | null;
    color_agenda: string;
    biografia: string | null;
    foto: string | null;
    status: boolean;
    created_at: string;
    nombre_completo: string;
    titulo_licencia_internacional: string;
    telefono_whatsapp?: string | null;
}

interface MedicosPageProps {
    auth: Auth;
    medicos: Paginated<Medico>;
    stats: {
        total: number;
        activos: number;
        inactivos: number;
        con_usuario: number;
    };
    especialidades: EspecialidadItem[];
    paises: PaisPhoneOption[];
    users: UserItem[];
    etiquetaLicenciaPais: string;
    siguienteCodigoMedico: string;
    filters: {
        search?: string;
        especialidad_id?: string;
        status?: string;
        perPage?: string;
    };
}

export default function MedicosIndexPage({
    auth,
    medicos,
    stats,
    especialidades = [],
    paises = [],
    users = [],
    etiquetaLicenciaPais = 'N° Licencia / Colegiatura Médica',
    siguienteCodigoMedico,
    filters,
}: MedicosPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Doctors'), href: '/admin/medicos' },
    ];

    // ── Estados ──────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [editingMedico, setEditingMedico]     = useState<Medico | null>(null);
    const [modalTab, setModalTab]               = useState('general');
    const [isTableLoading, setIsTableLoading]   = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]             = useState(filters.search || '');
    const [especialidadFilter, setEspecialidadFilter] = useState(filters.especialidad_id || '');
    const [statusFilter, setStatusFilter]         = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter]       = useState(filters.perPage || '10');

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm({
        codigo_medico: siguienteCodigoMedico,
        nombres: '',
        apellidos: '',
        documento_identidad: '',
        licencia_medica: '',
        tipo_licencia: '',
        especialidad_principal_id: '' as string | number,
        especialidades_secundarias: [] as number[],
        pais_telefono_id: '' as string | number,
        telefono: '',
        email: '',
        user_id: '' as string | number,
        color_agenda: '#3b82f6',
        biografia: '',
        status: true,
        crear_usuario_acceso: true,
        password_acceso: '',
        enviar_whatsapp_credenciales: true,
    });

    // ── Hooks de navegación & Debounce de Filtros ──────────────────────────────
    useEffect(() => {
        const unbindStart = router.on('start', (event) => {
            if (event.detail.visit.method === 'get') {
                setIsTableLoading(true);
            }
        });
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    especialidad_id: especialidadFilter,
                    status: statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, especialidadFilter, statusFilter, perPageFilter]);

    // ── Handlers Modal ────────────────────────────────────────────────────────
    const handleCreateClick = () => {
        setEditingMedico(null);
        reset();
        setModalTab('general');
        setData({
            codigo_medico: siguienteCodigoMedico,
            nombres: '',
            apellidos: '',
            documento_identidad: '',
            licencia_medica: '',
            tipo_licencia: '',
            especialidad_principal_id: especialidades[0]?.id || '',
            especialidades_secundarias: [],
            pais_telefono_id: paises[0]?.id || '',
            telefono: '',
            email: '',
            user_id: '',
            color_agenda: '#3b82f6',
            biografia: '',
            status: true,
            crear_usuario_acceso: true,
            password_acceso: '',
            enviar_whatsapp_credenciales: true,
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (medico: Medico) => {
        setEditingMedico(medico);
        setModalTab('general');
        const secundariasIds = medico.especialidades ? medico.especialidades.map((e) => e.id) : [];
        setData({
            codigo_medico: medico.codigo_medico,
            nombres: medico.nombres || '',
            apellidos: medico.apellidos || '',
            documento_identidad: medico.documento_identidad || '',
            licencia_medica: medico.licencia_medica || '',
            tipo_licencia: medico.tipo_licencia || '',
            especialidad_principal_id: medico.especialidad_principal_id || '',
            especialidades_secundarias: secundariasIds,
            pais_telefono_id: medico.pais_telefono_id ?? '',
            telefono: medico.telefono || '',
            email: medico.email || '',
            user_id: medico.user_id || '',
            color_agenda: medico.color_agenda || '#3b82f6',
            biografia: medico.biografia || '',
            status: medico.status,
            crear_usuario_acceso: false,
            password_acceso: '',
            enviar_whatsapp_credenciales: true,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMedico) {
            put(`/admin/medicos/${editingMedico.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/medicos', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (medico: Medico) => {
        router.patch(`/admin/medicos/${medico.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (medico: Medico) => {
        if (confirm(__('Are you sure you want to delete this doctor record?'))) {
            router.delete(`/admin/medicos/${medico.id}`, {
                preserveScroll: true,
            });
        }
    };


    const sendWhatsAppCredentials = (medico: Medico) => {
        router.post(
            `/admin/medicos/${medico.id}/send-whatsapp-credentials`,
            {},
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    notifySuccess(__('Notificación de credenciales enviada por WhatsApp.'));
                    if (page?.props?.flash?.wa_url) {
                        window.open(page.props.flash.wa_url, '_blank');
                    }
                },
                onError: () => {
                    notifyError(__('No se pudo procesar la notificación por WhatsApp.'));
                },
            }
        );
    };

    const toggleSecundaria = (espId: number) => {
        const current = [...data.especialidades_secundarias];
        if (current.includes(espId)) {
            setData('especialidades_secundarias', current.filter((id) => id !== espId));
        } else {
            setData('especialidades_secundarias', [...current, espId]);
        }
    };

    // ── Columnas de la Tabla DataTable ────────────────────────────────────────
    const columns: ColumnDef<Medico>[] = [
        {
            header: __('Doctor / Professional'),
            accessorKey: 'nombres',
            className: 'font-medium',
            cell: (medico) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs text-white"
                        style={{ backgroundColor: medico.color_agenda || '#3b82f6' }}
                    >
                        <Stethoscope className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {medico.nombre_completo}
                            {medico.status && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
                                {medico.codigo_medico}
                            </Badge>
                            {medico.documento_identidad && (
                                <span className="text-xs text-muted-foreground">• DNI: {medico.documento_identidad}</span>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: __('Specialty'),
            hideOn: 'mobile',
            cell: (medico) => (
                <div className="space-y-1">
                    {medico.especialidad_principal ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 font-semibold text-xs">
                            {medico.especialidad_principal.nombre}
                        </Badge>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                    )}

                    {medico.especialidades && medico.especialidades.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {medico.especialidades.map((esp) => (
                                <Badge key={esp.id} variant="outline" className="text-[10px] text-slate-600 dark:text-slate-400">
                                    + {esp.nombre}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: __('License / Registration N°'),
            hideOn: 'mobile',
            cell: (medico) => (
                <div>
                    <span className="text-xs text-muted-foreground block font-medium">
                        {medico.titulo_licencia_internacional}
                    </span>
                    <span className="text-sm font-mono font-semibold text-foreground">
                        {medico.licencia_medica || '—'}
                    </span>
                </div>
            ),
        },
        {
            header: __('Contact'),
            hideOn: 'mobile',
            cell: (medico) => (
                <div className="space-y-0.5">
                    {medico.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium font-mono">
                            <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            {medico.telefono_whatsapp || medico.telefono}
                        </div>
                    )}
                    {medico.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[160px]">
                            <Mail className="w-3 h-3" />
                            {medico.email}
                        </div>
                    )}
                    {!medico.telefono && !medico.email && <span className="text-xs text-muted-foreground">—</span>}
                </div>
            ),
        },
        {
            header: __('System User'),
            hideOn: 'mobile',
            cell: (medico) => (
                medico.user ? (
                    <Badge variant="secondary" className="text-xs gap-1.5 font-normal">
                        <User className="w-3 h-3 text-blue-600" />
                        {medico.user.name}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground italic">{__('No User Linked')}</span>
                )
            ),
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (medico) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={medico.status}
                        onCheckedChange={() => handleToggleStatus(medico)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            medico.status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {medico.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (medico) => (
                <div className="flex items-center justify-end gap-1">
                        {medico.telefono && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                onClick={() => sendWhatsAppCredentials(medico)}
                                title={__('Enviar Credenciales por WhatsApp')}
                            >
                                <MessageCircle className="h-4 w-4" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(medico)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {__('Edit Record')}
                                </DropdownMenuItem>
                                {medico.telefono && (
                                    <DropdownMenuItem onClick={() => sendWhatsAppCredentials(medico)}>
                                        <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                        {__('Enviar Credenciales WhatsApp')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleStatus(medico)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {medico.status ? __('Deactivate') : __('Activate')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(medico)}
                                    className="text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {__('Delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
            ),
        },
    ];

    return (
        <>
            <Head title={__('Doctors')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Stethoscope className="h-6 w-6 text-white" />}
                    title={__('Doctors Management')}
                    description={__('Medical professionals management, license registry, multi-specialties and system user linkage.')}
                    colorClassName="bg-blue-600"
                >
                    <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="mr-2 h-4 w-4" />
                        {__('New Doctor')}
                    </Button>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <StatCard
                        icon={<Stethoscope className="h-6 w-6" />}
                        title={__('TOTAL DOCTORS')}
                        value={stats.total}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE DOCTORS')}
                        value={stats.activos}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<Activity className="h-6 w-6" />}
                        title={__('INACTIVE DOCTORS')}
                        value={stats.inactivos}
                        colorClassName="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <StatCard
                        icon={<User className="h-6 w-6" />}
                        title={__('WITH SYSTEM USER')}
                        value={stats.con_usuario}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, ID, license, code or contact...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label={__('Specialty')}>
                            <Select value={especialidadFilter} onValueChange={setEspecialidadFilter}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue placeholder={__('All Specialties')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('All Specialties')}</SelectItem>
                                    {especialidades.map((esp) => (
                                        <SelectItem key={esp.id} value={esp.id.toString()}>
                                            {esp.nombre}
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
                                <SelectTrigger className="w-full md:w-36">
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

                {/* Tabla DataTable */}
                <div className="w-full">
                    <DataTable
                        data={medicos}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(medico) => handleEditClick(medico)}
                        emptyState={{
                            title: __('No doctors found'),
                            description: searchTerm || especialidadFilter || statusFilter
                                ? __('Try clearing your search filters or changing your query.')
                                : __('You have not registered any medical professionals in the database yet.'),
                            ctaLabel: __('New Doctor'),
                            onCtaClick: () => handleCreateClick(),
                        }}
                    />
                </div>
            </div>

            {/* ══ Modal de Creación / Edición de Médico ══════════════════════════════════ */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 flex items-center justify-center font-bold text-lg shrink-0">
                                        <Stethoscope className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">
                                            {editingMedico
                                                ? `${__('Edit Doctor')}: ${editingMedico.nombre_completo}`
                                                : __('New Doctor')}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                            {__('Complete the medical professional information across the available tabs.')}
                                        </DialogDescription>
                                    </div>
                                </div>

                                <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                                    {data.codigo_medico}
                                </Badge>
                            </div>
                        </DialogHeader>

                        {/* Pestañas del Formulario */}
                        <Tabs value={modalTab} onValueChange={setModalTab} className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> {__('Personal & Contact')}
                                </TabsTrigger>
                                <TabsTrigger value="especialidades" className="flex items-center gap-2">
                                    <Award className="h-4 w-4" /> {__('Specialties & License')}
                                </TabsTrigger>
                                <TabsTrigger value="bio" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> {__('Bio & Preferences')}
                                </TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Datos Personales & Contacto */}
                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="nombres">{__('First Names')} *</Label>
                                        <Input
                                            id="nombres"
                                            value={data.nombres}
                                            onChange={(e) => setData('nombres', e.target.value)}
                                            placeholder="Ej: Alejandro"
                                            className="mt-1"
                                        />
                                        {errors.nombres && (
                                            <p className="text-red-500 text-xs mt-1">{errors.nombres}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="apellidos">{__('Last Names')} *</Label>
                                        <Input
                                            id="apellidos"
                                            value={data.apellidos}
                                            onChange={(e) => setData('apellidos', e.target.value)}
                                            placeholder="Ej: Mendoza Silva"
                                            className="mt-1"
                                        />
                                        {errors.apellidos && (
                                            <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="documento_identidad">{__('ID Document / DNI')}</Label>
                                        <Input
                                            id="documento_identidad"
                                            value={data.documento_identidad}
                                            onChange={(e) => setData('documento_identidad', e.target.value)}
                                            placeholder="V-14920394"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="telefono">{__('Phone (WhatsApp)')}</Label>
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={data.pais_telefono_id}
                                            phoneValue={data.telefono || ''}
                                            onPaisChange={(v) => setData('pais_telefono_id', v)}
                                            onPhoneChange={(v) => setData('telefono', v)}
                                            placeholder="000-0000000"
                                            error={errors.telefono}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="email">{__('Email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="doctor@clinica.com"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                {/* Opción de Auto-Creación de Cuenta de Usuario y Notificación por WhatsApp */}
                                {!editingMedico && (
                                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                <Label htmlFor="crear_usuario_acceso" className="font-bold text-sm cursor-pointer text-foreground">
                                                    {__('Crear usuario de acceso al sistema para este médico')}
                                                </Label>
                                            </div>
                                            <Switch
                                                id="crear_usuario_acceso"
                                                checked={data.crear_usuario_acceso}
                                                onCheckedChange={(c) => setData('crear_usuario_acceso', c)}
                                            />
                                        </div>

                                        {data.crear_usuario_acceso && (
                                            <div className="space-y-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                                                <div>
                                                    <Label htmlFor="password_acceso" className="text-xs">
                                                        {__('Contraseña de acceso (opcional)')}
                                                    </Label>
                                                    <Input
                                                        id="password_acceso"
                                                        type="password"
                                                        value={data.password_acceso}
                                                        onChange={(e) => setData('password_acceso', e.target.value)}
                                                        placeholder="Dejar vacío para auto-generar contraseña temporal"
                                                        className="mt-1 bg-background text-xs"
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <Label htmlFor="enviar_whatsapp_credenciales" className="text-xs text-muted-foreground font-medium cursor-pointer">
                                                            {__('Enviar notificación cordial de bienvenida con credenciales por WhatsApp')}
                                                        </Label>
                                                    </div>
                                                    <Switch
                                                        id="enviar_whatsapp_credenciales"
                                                        checked={data.enviar_whatsapp_credenciales}
                                                        onCheckedChange={(c) => setData('enviar_whatsapp_credenciales', c)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
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
                            </TabsContent>

                            {/* Tab 2: Especialidades & Registro Profesional (Adaptabilidad Internacional) */}
                            <TabsContent value="especialidades" className="space-y-4">
                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-400 font-medium">
                                    El formato y nomenclatura de la licencia médica se ajusta automáticamente al país de la clínica ({etiquetaLicenciaPais}).
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="especialidad_principal_id">{__('Primary Specialty')} *</Label>
                                        <Select
                                            value={data.especialidad_principal_id ? data.especialidad_principal_id.toString() : ''}
                                            onValueChange={(val) => setData('especialidad_principal_id', val)}
                                        >
                                            <SelectTrigger id="especialidad_principal_id" className="w-full mt-1">
                                                <SelectValue placeholder={__('Select Primary Specialty')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {especialidades.map((esp) => (
                                                    <SelectItem key={esp.id} value={esp.id.toString()}>
                                                        {esp.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="licencia_medica">
                                            {etiquetaLicenciaPais}
                                        </Label>
                                        <Input
                                            id="licencia_medica"
                                            value={data.licencia_medica}
                                            onChange={(e) => setData('licencia_medica', e.target.value)}
                                            placeholder="N° Registro / Cédula profesional"
                                            className="font-mono mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="color_agenda">{__('Agenda Color')}</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="color"
                                                id="color_agenda"
                                                value={data.color_agenda}
                                                onChange={(e) => setData('color_agenda', e.target.value)}
                                                className="w-9 h-9 rounded-md border cursor-pointer p-0.5"
                                            />
                                            <Input
                                                value={data.color_agenda}
                                                onChange={(e) => setData('color_agenda', e.target.value)}
                                                className="font-mono uppercase text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Selección Múltiple de Especialidades Secundarias */}
                                <div>
                                    <Label className="block mb-2">{__('Secondary Specialties')}</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border rounded-xl bg-muted/30">
                                        {especialidades.map((esp) => {
                                            const isSelected = data.especialidades_secundarias.includes(esp.id);
                                            const isPrimary = Number(data.especialidad_principal_id) === esp.id;
                                            if (isPrimary) return null;

                                            return (
                                                <button
                                                    type="button"
                                                    key={esp.id}
                                                    onClick={() => toggleSecundaria(esp.id)}
                                                    className={cn(
                                                        'flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all',
                                                        isSelected
                                                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                                                            : 'bg-background hover:bg-muted border-input text-foreground'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                                                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-input'
                                                        )}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <span className="truncate">{esp.nombre}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 3: Biografía & Perfil Curricular */}
                            <TabsContent value="bio" className="space-y-4">
                                <div>
                                    <Label htmlFor="biografia">{__('Professional Bio')}</Label>
                                    <Textarea
                                        id="biografia"
                                        value={data.biografia}
                                        onChange={(e) => setData('biografia', e.target.value)}
                                        placeholder="Resumen curricular, estudios de posgrado, universidad de egreso..."
                                        rows={5}
                                        className="mt-1"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-8 border-t border-border/40 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                {editingMedico ? __('Save Changes') : __('Register Doctor')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
