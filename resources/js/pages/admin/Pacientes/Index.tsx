import { Head, useForm, router } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    User,
    Phone,
    Mail,
    PawPrint,
    MoreVertical,
    Pencil,
    ToggleRight,
    MessageCircle,
    CheckCircle,
    Activity,
    Plus,
    Trash2,
    HeartPulse,
    Calendar,
    BadgeAlert,
    ShieldAlert,
    FileText,
    MapPin,
    Building2,
    Sparkles,
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

interface Paciente {
    id: number;
    codigo_paciente: string;
    tipo_paciente: 'humano' | 'animal';
    nombres: string | null;
    apellidos: string | null;
    documento_identidad: string | null;
    fecha_nacimiento: string | null;
    genero: string | null;
    pais_telefono_id?: number | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
    tipo_sangre: string | null;
    alergias: string | null;
    antecedentes_medicos: string | null;
    foto: string | null;
    nombre_mascota: string | null;
    especie: string | null;
    raza: string | null;
    color_marcas: string | null;
    microchip: string | null;
    esterilizado: boolean;
    tutor_nombre: string | null;
    tutor_documento: string | null;
    pais_telefono_tutor_id?: number | null;
    tutor_telefono: string | null;
    tutor_email: string | null;
    status: boolean;
    created_at: string;
    nombre_completo: string;
    edad: string | null;
    telefono_whatsapp?: string | null;
    telefono_tutor_whatsapp?: string | null;
}

interface PacientesPageProps {
    auth: Auth;
    pacientes: Paginated<Paciente>;
    stats: {
        total: number;
        humanos: number;
        mascotas: number;
        activos: number;
    };
    paises: PaisPhoneOption[];
    empresaNombre?: string;
    filters: {
        search?: string;
        tipo_paciente?: string;
        status?: string;
        perPage?: string;
    };
    tieneVeterinaria: boolean;
    tieneHumano: boolean;
    siguienteCodigoHumano: string;
    siguienteCodigoAnimal: string;
}

function calcularEdadLive(fechaNacimientoStr: string): string | null {
    if (!fechaNacimientoStr) return null;
    const nac = new Date(fechaNacimientoStr);
    if (isNaN(nac.getTime())) return null;
    const hoy = new Date();

    let anios = hoy.getFullYear() - nac.getFullYear();
    let meses = hoy.getMonth() - nac.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) {
        anios--;
        meses += 12;
    }

    if (anios >= 1) {
        return `${anios} ${anios === 1 ? 'año' : 'años'}`;
    }
    const totalMeses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
    if (totalMeses >= 1) {
        return `${totalMeses} ${totalMeses === 1 ? 'mes' : 'meses'}`;
    }
    const dias = Math.floor((hoy.getTime() - nac.getTime()) / (1000 * 60 * 60 * 24));
    return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

export default function PacientesIndexPage({
    auth,
    pacientes,
    stats,
    paises = [],
    empresaNombre = 'nuestro centro médico',
    filters,
    tieneVeterinaria = false,
    tieneHumano = true,
    siguienteCodigoHumano,
    siguienteCodigoAnimal,
}: PacientesPageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Patients'), href: '/admin/pacientes' },
    ];

    // ── Estados ──────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
    const [modalTab, setModalTab]             = useState('general');
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm]       = useState(filters.search || '');
    const [tipoFilter, setTipoFilter]       = useState(filters.tipo_paciente || '');
    const [statusFilter, setStatusFilter]   = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    const initialTipo: 'humano' | 'animal' = tieneVeterinaria && !tieneHumano ? 'animal' : 'humano';

    // ── Formulario Inertia ────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm({
        tipo_paciente: initialTipo as 'humano' | 'animal',
        codigo_paciente: siguienteCodigoHumano,
        nombres: '',
        apellidos: '',
        documento_identidad: '',
        fecha_nacimiento: '',
        genero: 'masculino',
        pais_telefono_id: '' as string | number,
        telefono: '',
        email: '',
        direccion: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        tipo_sangre: '',
        alergias: '',
        antecedentes_medicos: '',
        nombre_mascota: '',
        especie: 'Canino',
        raza: '',
        color_marcas: '',
        microchip: '',
        esterilizado: false,
        tutor_nombre: '',
        tutor_documento: '',
        pais_telefono_tutor_id: '' as string | number,
        tutor_telefono: '',
        tutor_email: '',
        status: true,
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
                    tipo_paciente: tipoFilter,
                    status: statusFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, tipoFilter, statusFilter, perPageFilter]);

    // ── Handlers Modal ────────────────────────────────────────────────────────
    const handleCreateClick = (tipoDefault?: 'humano' | 'animal') => {
        setEditingPaciente(null);
        reset();
        setModalTab('general');
        const tipo = tipoDefault || initialTipo;
        setData({
            tipo_paciente: tipo,
            codigo_paciente: tipo === 'animal' ? siguienteCodigoAnimal : siguienteCodigoHumano,
            nombres: '',
            apellidos: '',
            documento_identidad: '',
            fecha_nacimiento: '',
            genero: 'masculino',
            pais_telefono_id: paises[0]?.id || '',
            telefono: '',
            email: '',
            direccion: '',
            contacto_emergencia_nombre: '',
            contacto_emergencia_telefono: '',
            tipo_sangre: '',
            alergias: '',
            antecedentes_medicos: '',
            nombre_mascota: '',
            especie: 'Canino',
            raza: '',
            color_marcas: '',
            microchip: '',
            esterilizado: false,
            tutor_nombre: '',
            tutor_documento: '',
            pais_telefono_tutor_id: paises[0]?.id || '',
            tutor_telefono: '',
            tutor_email: '',
            status: true,
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (paciente: Paciente) => {
        setEditingPaciente(paciente);
        setModalTab('general');
        setData({
            tipo_paciente: paciente.tipo_paciente,
            codigo_paciente: paciente.codigo_paciente,
            nombres: paciente.nombres || '',
            apellidos: paciente.apellidos || '',
            documento_identidad: paciente.documento_identidad || '',
            fecha_nacimiento: paciente.fecha_nacimiento ? paciente.fecha_nacimiento.substring(0, 10) : '',
            genero: (paciente.genero as any) || 'masculino',
            pais_telefono_id: paciente.pais_telefono_id ?? '',
            telefono: paciente.telefono || '',
            email: paciente.email || '',
            direccion: paciente.direccion || '',
            contacto_emergencia_nombre: paciente.contacto_emergencia_nombre || '',
            contacto_emergencia_telefono: paciente.contacto_emergencia_telefono || '',
            tipo_sangre: paciente.tipo_sangre || '',
            alergias: paciente.alergias || '',
            antecedentes_medicos: paciente.antecedentes_medicos || '',
            nombre_mascota: paciente.nombre_mascota || '',
            especie: paciente.especie || 'Canino',
            raza: paciente.raza || '',
            color_marcas: paciente.color_marcas || '',
            microchip: paciente.microchip || '',
            esterilizado: paciente.esterilizado || false,
            tutor_nombre: paciente.tutor_nombre || '',
            tutor_documento: paciente.tutor_documento || '',
            pais_telefono_tutor_id: paciente.pais_telefono_tutor_id ?? '',
            tutor_telefono: paciente.tutor_telefono || '',
            tutor_email: paciente.tutor_email || '',
            status: paciente.status,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPaciente) {
            put(`/admin/pacientes/${editingPaciente.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        } else {
            post('/admin/pacientes', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
                onError: () => notifyError(__('Please review the highlighted fields.')),
            });
        }
    };

    const handleToggleStatus = (paciente: Paciente) => {
        router.patch(`/admin/pacientes/${paciente.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (paciente: Paciente) => {
        if (confirm(__('Are you sure you want to delete this patient record?'))) {
            router.delete(`/admin/pacientes/${paciente.id}`, {
                preserveScroll: true,
            });
        }
    };


    const sendWhatsApp = (paciente: Paciente) => {
        router.post(
            `/admin/pacientes/${paciente.id}/send-whatsapp-welcome`,
            {},
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    notifySuccess(__('Mensaje de bienvenida enviado por WhatsApp vía integración.'));
                    if (page?.props?.flash?.wa_url) {
                        window.open(page.props.flash.wa_url, '_blank');
                    }
                },
                onError: () => {
                    notifyError(__('No se pudo procesar el envío por WhatsApp. Verifique el número o la configuración del servicio.'));
                },
            }
        );
    };

    // ── Columnas de la Tabla DataTable ────────────────────────────────────────
    const columns: ColumnDef<Paciente>[] = [
        {
            header: __('Patient / Record'),
            accessorKey: 'nombres',
            className: 'font-medium',
            cell: (paciente) => {
                const isAnimal = paciente.tipo_paciente === 'animal';
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs',
                                isAnimal
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900'
                            )}
                        >
                            {isAnimal ? <PawPrint className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground">{paciente.nombre_completo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground">
                                    {paciente.codigo_paciente}
                                </Badge>
                                {paciente.edad && (
                                    <span className="text-xs text-muted-foreground">• {paciente.edad}</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: __('Identification'),
            hideOn: 'mobile',
            cell: (paciente) => {
                const isAnimal = paciente.tipo_paciente === 'animal';
                return isAnimal ? (
                    <div>
                        <span className="text-sm font-medium block text-foreground">
                            {paciente.especie} - {paciente.raza || __('N/D Breed')}
                        </span>
                        {paciente.microchip && (
                            <span className="text-xs font-mono text-muted-foreground">
                                Chip: {paciente.microchip}
                            </span>
                        )}
                    </div>
                ) : (
                    <div>
                        <span className="text-sm font-medium block text-foreground">
                            {paciente.documento_identidad || __('No ID Document')}
                        </span>
                        <span className="text-xs capitalize text-muted-foreground">
                            {paciente.genero ? __(paciente.genero) : __('Unspecified')}
                        </span>
                    </div>
                );
            },
        },
        {
            header: __('Age'),
            accessorKey: 'edad',
            hideOn: 'mobile',
            cell: (paciente) => (
                <span className="text-sm font-semibold text-foreground">
                    {paciente.edad || '—'}
                </span>
            ),
        },
        {
            header: __('Contact / Owner'),
            hideOn: 'mobile',
            cell: (paciente) => {
                const isAnimal = paciente.tipo_paciente === 'animal';
                return isAnimal ? (
                    <div>
                        <span className="text-sm font-medium text-foreground block">
                            {__('Tutor')}: {paciente.tutor_nombre || 'N/D'}
                        </span>
                        {paciente.tutor_telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                {paciente.telefono_tutor_whatsapp || paciente.tutor_telefono}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {paciente.telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium font-mono">
                                <Phone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                {paciente.telefono_whatsapp || paciente.telefono}
                            </div>
                        )}
                        {paciente.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[160px]">
                                <Mail className="w-3 h-3" />
                                {paciente.email}
                            </div>
                        )}
                        {!paciente.telefono && !paciente.email && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                );
            },
        },
        {
            header: __('Medical Info'),
            hideOn: 'mobile',
            cell: (paciente) => {
                const isAnimal = paciente.tipo_paciente === 'animal';
                return isAnimal ? (
                    <Badge variant="secondary" className="text-xs">
                        {paciente.esterilizado ? __('Neutered/Spayed') : __('Intact')}
                    </Badge>
                ) : (
                    <div className="space-y-1">
                        {paciente.tipo_sangre && (
                            <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 dark:text-red-400 dark:border-red-900">
                                Sangre: {paciente.tipo_sangre}
                            </Badge>
                        )}
                        {paciente.alergias && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 block truncate max-w-[150px]">
                                {__('Allergies')}: {paciente.alergias}
                            </span>
                        )}
                        {!paciente.tipo_sangre && !paciente.alergias && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                );
            },
        },
        {
            header: __('Status'),
            stopRowClick: true,
            cell: (paciente) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={paciente.status}
                        onCheckedChange={() => handleToggleStatus(paciente)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            paciente.status
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {paciente.status ? __('Active') : __('Inactive')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Actions'),
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (paciente) => {
                const phoneToUse = paciente.tipo_paciente === 'animal'
                    ? (paciente.telefono_tutor_whatsapp || paciente.tutor_telefono)
                    : (paciente.telefono_whatsapp || paciente.telefono);

                return (
                    <div className="flex items-center justify-end gap-1">
                        {phoneToUse && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                onClick={() => sendWhatsApp(paciente)}
                                title={__('Send WhatsApp Welcome Message')}
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
                                <DropdownMenuItem onClick={() => handleEditClick(paciente)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {__('Edit Record')}
                                </DropdownMenuItem>
                                {phoneToUse && (
                                    <DropdownMenuItem onClick={() => sendWhatsApp(paciente)}>
                                        <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                        {__('Enviar Bienvenida WhatsApp')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleStatus(paciente)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {paciente.status ? __('Deactivate') : __('Activate')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(paciente)}
                                    className="text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {__('Delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title={__('Patients')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Users className="h-6 w-6 text-white" />}
                    title={__('Patients Management')}
                    description={__('Adaptive patient records, human health histories and veterinary pet files.')}
                    colorClassName="bg-indigo-600"
                >
                    <div className="flex items-center gap-2">
                        {tieneVeterinaria && (
                            <Button
                                onClick={() => handleCreateClick('animal')}
                                variant="outline"
                                className="border-emerald-600/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                                <PawPrint className="mr-2 h-4 w-4" />
                                {__('New Pet Record')}
                            </Button>
                        )}
                        {tieneHumano && (
                            <Button onClick={() => handleCreateClick('humano')}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {__('New Patient')}
                            </Button>
                        )}
                    </div>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-6 w-6" />}
                        title={__('TOTAL PATIENTS')}
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<User className="h-6 w-6" />}
                        title={__('HUMAN PATIENTS')}
                        value={stats.humanos}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    />
                    {tieneVeterinaria && (
                        <StatCard
                            icon={<PawPrint className="h-6 w-6" />}
                            title={__('PET RECORDS')}
                            value={stats.mascotas}
                            colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        />
                    )}
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('ACTIVE PATIENTS')}
                        value={stats.activos}
                        colorClassName="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by name, ID, code, pet or owner...')}
                                className="w-full md:w-80"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        {tieneVeterinaria && tieneHumano && (
                            <FilterField label={__('Patient Type')}>
                                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                                    <SelectTrigger className="w-full md:w-44">
                                        <SelectValue placeholder={__('All Types')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">{__('All Types')}</SelectItem>
                                        <SelectItem value="humano">{__('Human Patients')}</SelectItem>
                                        <SelectItem value="animal">{__('Pets / Animals')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        )}

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
                        data={pacientes}
                        columns={columns}
                        isLoading={isTableLoading}
                        onRowClick={(paciente) => handleEditClick(paciente)}
                        emptyState={{
                            title: __('No patients found'),
                            description: searchTerm || tipoFilter || statusFilter
                                ? __('Try clearing your search filters or changing your query.')
                                : __('You have not registered any patients in the database yet.'),
                            ctaLabel: __('New Patient'),
                            onCtaClick: () => handleCreateClick(),
                        }}
                    />
                </div>
            </div>

            {/* ══ Modal de Creación / Edición Adaptativo con PhoneInputGroup ═══════════════ */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border shadow-xs',
                                            data.tipo_paciente === 'animal'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400'
                                        )}
                                    >
                                        {data.tipo_paciente === 'animal' ? (
                                            <PawPrint className="h-5 w-5" />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">
                                            {editingPaciente
                                                ? `${__('Edit Patient')}: ${editingPaciente.nombre_completo}`
                                                : __('New Patient Record')}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                            {__('Complete the medical record information across the available tabs.')}
                                        </DialogDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                                        {data.codigo_paciente}
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Conmutador de Tipo de Paciente (Humano vs Mascota) */}
                        {tieneVeterinaria && tieneHumano && !editingPaciente && (
                            <div className="p-1 bg-muted/60 rounded-xl grid grid-cols-2 gap-1 my-4">
                                <Button
                                    type="button"
                                    variant={data.tipo_paciente === 'humano' ? 'default' : 'ghost'}
                                    className="h-9 text-xs gap-2 font-semibold"
                                    onClick={() => {
                                        setData({
                                            ...data,
                                            tipo_paciente: 'humano',
                                            codigo_paciente: siguienteCodigoHumano,
                                        });
                                    }}
                                >
                                    <User className="w-4 h-4" /> {__('Human Patient')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={data.tipo_paciente === 'animal' ? 'default' : 'ghost'}
                                    className="h-9 text-xs gap-2 font-semibold"
                                    onClick={() => {
                                        setData({
                                            ...data,
                                            tipo_paciente: 'animal',
                                            codigo_paciente: siguienteCodigoAnimal,
                                        });
                                    }}
                                >
                                    <PawPrint className="w-4 h-4" /> {__('Pet / Animal Record')}
                                </Button>
                            </div>
                        )}

                        {/* Pestañas de Formulario según Tipo de Paciente */}
                        <Tabs value={modalTab} onValueChange={setModalTab} className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    {data.tipo_paciente === 'animal' ? (
                                        <PawPrint className="h-4 w-4" />
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                    {data.tipo_paciente === 'animal' ? __('Pet Details') : __('General & Contact')}
                                </TabsTrigger>
                                <TabsTrigger value="medico" className="flex items-center gap-2">
                                    {data.tipo_paciente === 'animal' ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <HeartPulse className="h-4 w-4" />
                                    )}
                                    {data.tipo_paciente === 'animal' ? __('Owner / Tutor') : __('Medical Background')}
                                </TabsTrigger>
                            </TabsList>

                            {data.tipo_paciente === 'humano' ? (
                                /* ════ FORMULARIO HUMANO ════ */
                                <>
                                    {/* Tab 1: Datos Personales & Contacto */}
                                    <TabsContent value="general" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="nombres">{__('First Names')} *</Label>
                                                <Input
                                                    id="nombres"
                                                    value={data.nombres}
                                                    onChange={(e) => setData('nombres', e.target.value)}
                                                    placeholder="Ej: Juan Carlos"
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
                                                    placeholder="Ej: Pérez Rodríguez"
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
                                                    placeholder="V-18293049"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label htmlFor="fecha_nacimiento">{__('Birth Date')}</Label>
                                                    {data.fecha_nacimiento && calcularEdadLive(data.fecha_nacimiento) && (
                                                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-bold px-1.5 py-0">
                                                            Edad: {calcularEdadLive(data.fecha_nacimiento)}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Input
                                                    id="fecha_nacimiento"
                                                    type="date"
                                                    value={data.fecha_nacimiento}
                                                    onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="genero">{__('Gender')}</Label>
                                                <Select value={data.genero} onValueChange={(val) => setData('genero', val)}>
                                                    <SelectTrigger id="genero" className="w-full mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="masculino">{__('Male')}</SelectItem>
                                                        <SelectItem value="femenino">{__('Female')}</SelectItem>
                                                        <SelectItem value="otro">{__('Other')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                    placeholder="paciente@correo.com"
                                                    className="mt-1"
                                                />
                                            </div>

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
                                        </div>

                                        <div>
                                            <Label htmlFor="direccion">{__('Address')}</Label>
                                            <Textarea
                                                id="direccion"
                                                value={data.direccion}
                                                onChange={(e) => setData('direccion', e.target.value)}
                                                placeholder={__('Full residential address...')}
                                                rows={2}
                                                className="mt-1"
                                            />
                                        </div>
                                    </TabsContent>

                                    {/* Tab 2: Información Médica & Emergencias */}
                                    <TabsContent value="medico" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="tipo_sangre">{__('Blood Group')}</Label>
                                                <Input
                                                    id="tipo_sangre"
                                                    placeholder="O+, A+, B-, AB+"
                                                    value={data.tipo_sangre}
                                                    onChange={(e) => setData('tipo_sangre', e.target.value)}
                                                    className="uppercase font-mono mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="contacto_emergencia_nombre">{__('Emergency Contact')}</Label>
                                                <Input
                                                    id="contacto_emergencia_nombre"
                                                    value={data.contacto_emergencia_nombre}
                                                    onChange={(e) => setData('contacto_emergencia_nombre', e.target.value)}
                                                    placeholder="Nombre de familiar"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="contacto_emergencia_telefono">{__('Emergency Phone')}</Label>
                                                <Input
                                                    id="contacto_emergencia_telefono"
                                                    value={data.contacto_emergencia_telefono}
                                                    onChange={(e) => setData('contacto_emergencia_telefono', e.target.value)}
                                                    placeholder="Teléfono..."
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="alergias">{__('Known Allergies')}</Label>
                                                <Textarea
                                                    id="alergias"
                                                    value={data.alergias}
                                                    onChange={(e) => setData('alergias', e.target.value)}
                                                    placeholder={__('Medications, food or environmental allergies...')}
                                                    rows={3}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="antecedentes_medicos">{__('Medical History / Pathologies')}</Label>
                                                <Textarea
                                                    id="antecedentes_medicos"
                                                    value={data.antecedentes_medicos}
                                                    onChange={(e) => setData('antecedentes_medicos', e.target.value)}
                                                    placeholder={__('Pre-existing conditions, chronic diseases, past surgeries...')}
                                                    rows={3}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </>
                            ) : (
                                /* ════ FORMULARIO MASCOTA / VETERINARIA ════ */
                                <>
                                    {/* Tab 1: Datos de la Mascota */}
                                    <TabsContent value="general" className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="nombre_mascota">{__('Pet Name')} *</Label>
                                                <Input
                                                    id="nombre_mascota"
                                                    value={data.nombre_mascota}
                                                    onChange={(e) => setData('nombre_mascota', e.target.value)}
                                                    placeholder="Ej: Bobby, Mia, Thor"
                                                    className="mt-1"
                                                />
                                                {errors.nombre_mascota && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.nombre_mascota}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="especie">{__('Species')} *</Label>
                                                <Input
                                                    id="especie"
                                                    placeholder="Canino, Felino, Equino, Ave..."
                                                    value={data.especie}
                                                    onChange={(e) => setData('especie', e.target.value)}
                                                    className="mt-1"
                                                />
                                                {errors.especie && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.especie}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="raza">{__('Breed')}</Label>
                                                <Input
                                                    id="raza"
                                                    value={data.raza}
                                                    onChange={(e) => setData('raza', e.target.value)}
                                                    placeholder="Golden Retriever, Mestizo..."
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="microchip">{__('Microchip / Tattoo N°')}</Label>
                                                <Input
                                                    id="microchip"
                                                    value={data.microchip}
                                                    onChange={(e) => setData('microchip', e.target.value)}
                                                    placeholder="CHIP-981203"
                                                    className="font-mono text-xs mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="color_marcas">{__('Color / Markings')}</Label>
                                                <Input
                                                    id="color_marcas"
                                                    value={data.color_marcas}
                                                    onChange={(e) => setData('color_marcas', e.target.value)}
                                                    placeholder="Dorado, Manchas negras..."
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="esterilizado">{__('Neutered/Spayed Status')}</Label>
                                                <Select
                                                    value={data.esterilizado ? 'true' : 'false'}
                                                    onValueChange={(val) => setData('esterilizado', val === 'true')}
                                                >
                                                    <SelectTrigger id="esterilizado" className="w-full mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">{__('Yes (Neutered/Spayed)')}</SelectItem>
                                                        <SelectItem value="false">{__('No (Intact)')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

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

                                    {/* Tab 2: Datos del Tutor / Propietario */}
                                    <TabsContent value="medico" className="space-y-4">
                                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                            {__('Información de contacto del propietario o tutor legal responsable de la mascota.')}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="tutor_nombre">{__('Owner Full Name')} *</Label>
                                                <Input
                                                    id="tutor_nombre"
                                                    value={data.tutor_nombre}
                                                    onChange={(e) => setData('tutor_nombre', e.target.value)}
                                                    placeholder="Ej: María López"
                                                    className="mt-1"
                                                />
                                                {errors.tutor_nombre && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.tutor_nombre}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="tutor_documento">{__('Owner ID Document / DNI')}</Label>
                                                <Input
                                                    id="tutor_documento"
                                                    value={data.tutor_documento}
                                                    onChange={(e) => setData('tutor_documento', e.target.value)}
                                                    placeholder="V-98765432"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="tutor_telefono">{__('Owner Phone (WhatsApp)')}</Label>
                                                <PhoneInputGroup
                                                    paises={paises}
                                                    selectedPaisId={data.pais_telefono_tutor_id}
                                                    phoneValue={data.tutor_telefono || ''}
                                                    onPaisChange={(v) => setData('pais_telefono_tutor_id', v)}
                                                    onPhoneChange={(v) => setData('tutor_telefono', v)}
                                                    placeholder="000-0000000"
                                                    error={errors.tutor_telefono}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="tutor_email">{__('Owner Email')}</Label>
                                                <Input
                                                    id="tutor_email"
                                                    type="email"
                                                    value={data.tutor_email}
                                                    onChange={(e) => setData('tutor_email', e.target.value)}
                                                    placeholder="tutor@correo.com"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>

                        <DialogFooter className="mt-8 border-t border-border/40 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingPaciente ? __('Save Changes') : __('Register Patient')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
