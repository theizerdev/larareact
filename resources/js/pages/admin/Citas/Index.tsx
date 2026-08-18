import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
    Calendar as CalendarIcon,
    Clock,
    UserCheck,
    Users,
    Stethoscope,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Video,
    Send,
    Trash2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Check,
    UserX,
    MapPin,
    DollarSign,
    User,
    PawPrint,
    X,
    ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select2, Select2Option } from '@/components/ui/select2';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/stat-card';
import { ModuleHeader } from '@/components/module-header';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cleanParams, cn } from '@/lib/utils';

// ── Componente MiniCalendar de Navegación Rápida ─────────────────────────────
interface MiniCalendarProps {
    selectedDate: Date;
    onSelectDate: (d: Date) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onSelectDate }) => {
    const [viewMonthDate, setViewMonthDate] = useState<Date>(new Date(selectedDate));

    useEffect(() => {
        setViewMonthDate(new Date(selectedDate));
    }, [selectedDate]);

    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Lunes start

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const prevDays = Array.from({ length: startDayOfWeek }, (_, i) => {
        const dayNum = prevMonthLastDay - startDayOfWeek + i + 1;
        return { date: new Date(year, month - 1, dayNum), isCurrentMonth: false };
    });

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
        return { date: new Date(year, month, i + 1), isCurrentMonth: true };
    });

    const totalCells = Math.ceil((prevDays.length + currentDays.length) / 7) * 7;
    const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
    const nextDays = Array.from({ length: nextDaysCount }, (_, i) => {
        return { date: new Date(year, month + 1, i + 1), isCurrentMonth: false };
    });

    const allCells = [...prevDays, ...currentDays, ...nextDays];

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const weekHeaderDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="space-y-3 p-3.5 bg-card rounded-2xl border shadow-xs">
            <div className="flex items-center justify-between px-1">
                <span className="font-bold text-sm text-foreground capitalize">
                    {monthNames[month]} {year}
                </span>
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => setViewMonthDate(new Date(year, month - 1, 1))}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        onClick={() => setViewMonthDate(new Date(year, month + 1, 1))}
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground border-b pb-1">
                {weekHeaderDays.map((d, i) => (
                    <div key={i}>{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {allCells.map((cell, idx) => {
                    const isSelected = cell.date.toDateString() === selectedDate.toDateString();
                    const isToday = cell.date.toDateString() === new Date().toDateString();

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onSelectDate(cell.date)}
                            className={cn(
                                'h-7 w-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-medium transition-all cursor-pointer',
                                !cell.isCurrentMonth && 'text-muted-foreground/30',
                                cell.isCurrentMonth && 'text-foreground hover:bg-muted',
                                isToday && !isSelected && 'border border-primary text-primary font-bold',
                                isSelected && 'bg-primary text-primary-foreground font-bold shadow-xs scale-105'
                            )}
                        >
                            {cell.date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ── Interfaces ───────────────────────────────────────────────────────────────
interface Paciente {
    id: number;
    codigo_paciente: string;
    nombres: string;
    apellidos: string;
    tipo_paciente: 'humano' | 'animal';
    nombre_mascota?: string;
    tutor_nombre?: string;
    telefono?: string;
    tutor_telefono?: string;
}

interface Medico {
    id: number;
    codigo_medico: string;
    nombres: string;
    apellidos: string;
    color_agenda: string;
    especialidad_principal_id?: number;
}

interface TipoAtencion {
    id: number;
    nombre: string;
    duracion_estimada_minutos: number;
    requiere_link_virtual: boolean;
    costo_adicional_sugerido?: number;
    modalidad: string;
}

interface Especialidad {
    id: number;
    nombre: string;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface Cita {
    id: number;
    codigo_cita: string;
    paciente_id: number;
    medico_id: number;
    especialidad_id?: number;
    tipo_atencion_id?: number;
    sucursal_id?: number;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
    duracion_minutos: number;
    estado: 'pendiente' | 'confirmada_pagada' | 'en_sala_espera' | 'en_consulta' | 'atendida' | 'cancelada' | 'no_asistio' | 'bloqueado';
    color_estado: string;
    estado_formateado: string;
    motivo_consulta?: string;
    notas_recepcion?: string;
    link_virtual?: string;
    monto_estimado: number;
    recordatorio_whatsapp_enviado: boolean;
    paciente?: Paciente;
    medico?: Medico;
    especialidad?: Especialidad;
    tipoAtencion?: TipoAtencion;
}

interface SlotDisponibilidad {
    inicio: string;
    fin: string;
    hora_inicio_formateada: string;
    hora_fin_formateada: string;
    label: string;
}

interface Props {
    citas: Cita[];
    medicos: Medico[];
    pacientes: Paciente[];
    especialidades: Especialidad[];
    tiposAtencion: TipoAtencion[];
    sucursales: Sucursal[];
    estadisticas: {
        citas_hoy: number;
        confirmadas: number;
        en_sala_espera: number;
        en_consulta: number;
        atendidas: number;
        canceladas: number;
    };
    filters: any;
}

export default function Index({
    citas,
    medicos,
    pacientes,
    especialidades,
    tiposAtencion,
    sucursales,
    estadisticas,
    filters,
}: Props) {
    const __ = (key: string) => key;

    // ── Search & Filter States ────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [medicoFilter, setMedicoFilter] = useState(filters.medico_id || 'all');
    const [especialidadFilter, setEspecialidadFilter] = useState(filters.especialidad_id || 'all');
    const [tipoAtencionFilter, setTipoAtencionFilter] = useState(filters.tipo_atencion_id || 'all');
    const [estadoFilter, setEstadoFilter] = useState(filters.estado || 'all');
    const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'table'>('week');
    const [slotInterval, setSlotInterval] = useState<number>(30); // 15, 20, 30, 60 min

    // ── FullCalendar & Navigation State ───────────────────────────────────────
    const calendarRef = useRef<any>(null);
    const [calendarTitle, setCalendarTitle] = useState('');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // ── Mapping & Filtering Events for FullCalendar ──────────────────────────
    const fullCalendarEvents = useMemo(() => {
        let filtered = citas;

        if (medicoFilter !== 'all') {
            filtered = filtered.filter((c) => c.medico_id.toString() === medicoFilter);
        }
        if (especialidadFilter !== 'all') {
            filtered = filtered.filter((c) => c.especialidad_id?.toString() === especialidadFilter);
        }
        if (tipoAtencionFilter !== 'all') {
            filtered = filtered.filter((c) => c.tipo_atencion_id?.toString() === tipoAtencionFilter);
        }
        if (estadoFilter !== 'all') {
            filtered = filtered.filter((c) => c.estado === estadoFilter);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((c) => {
                const cod = c.codigo_cita?.toLowerCase() || '';
                const pacNom = c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos} ${c.paciente.nombre_mascota || ''}`.toLowerCase() : '';
                const medNom = c.medico ? `${c.medico.nombres} ${c.medico.apellidos}`.toLowerCase() : '';
                return cod.includes(term) || pacNom.includes(term) || medNom.includes(term);
            });
        }

        return filtered.map((cita) => {
            const nombrePaciente = cita.paciente
                ? (cita.paciente.tipo_paciente === 'animal'
                    ? `🐾 ${cita.paciente.nombre_mascota}`
                    : `👤 ${cita.paciente.nombres} ${cita.paciente.apellidos}`)
                : 'Paciente N/A';

            const nombreMedico = cita.medico
                ? `Dr(a). ${cita.medico.nombres} ${cita.medico.apellidos}`
                : 'Médico N/A';

            return {
                id: cita.id.toString(),
                title: `${nombrePaciente} - ${nombreMedico}`,
                start: cita.fecha_hora_inicio.replace(' ', 'T'),
                end: cita.fecha_hora_fin.replace(' ', 'T'),
                backgroundColor: cita.color_estado || '#3b82f6',
                borderColor: cita.color_estado || '#3b82f6',
                textColor: '#ffffff',
                editable: true,
                extendedProps: {
                    cita,
                    codigo_cita: cita.codigo_cita,
                    estado: cita.estado,
                    estado_formateado: cita.estado_formateado,
                    paciente_nombre: nombrePaciente,
                    medico_nombre: nombreMedico,
                    tipo_atencion: cita.tipoAtencion?.nombre || 'Consulta',
                    link_virtual: cita.link_virtual,
                    duracion_minutos: cita.duracion_minutos,
                },
            };
        });
    }, [citas, medicoFilter, especialidadFilter, tipoAtencionFilter, estadoFilter, searchTerm]);

    const handleDatesSet = (dateInfo: any) => {
        setCalendarTitle(dateInfo.view.title);
        setCurrentDate(dateInfo.view.calendar.getDate());
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (!calendarRef.current) return;
        const api = calendarRef.current.getApi();
        if (direction === 'today') api.today();
        else if (direction === 'next') api.next();
        else if (direction === 'prev') api.prev();
    };

    const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'table') => {
        setViewMode(mode);
        if (!calendarRef.current) return;
        const api = calendarRef.current.getApi();
        const map: Record<string, string> = {
            day: 'timeGridDay',
            week: 'timeGridWeek',
            month: 'dayGridMonth',
            table: 'listMonth',
        };
        if (map[mode]) {
            api.changeView(map[mode]);
        }
    };

    const handleMiniCalendarSelect = (d: Date) => {
        setCurrentDate(d);
        if (calendarRef.current) {
            calendarRef.current.getApi().gotoDate(d);
        }
    };

    const handleEventDrop = (info: any) => {
        const citaId = info.event.id;
        const startStr = info.event.startStr;
        const endStr = info.event.endStr || new Date(info.event.start.getTime() + (info.event.extendedProps.duracion_minutos || 30) * 60000).toISOString();

        router.patch(
            `/admin/citas/${citaId}/mover`,
            {
                fecha_hora_inicio: startStr,
                fecha_hora_fin: endStr,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    notifySuccess(__('Cita reprogramada con éxito.'));
                },
                onError: (errs) => {
                    info.revert();
                    notifyError((Object.values(errs)[0] as string) || __('No se pudo reprogramar la cita.'));
                },
            }
        );
    };

    const handleEventResize = (info: any) => {
        const citaId = info.event.id;
        const startStr = info.event.startStr;
        const endStr = info.event.endStr;

        router.patch(
            `/admin/citas/${citaId}/mover`,
            {
                fecha_hora_inicio: startStr,
                fecha_hora_fin: endStr,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    notifySuccess(__('Duración de la cita actualizada con éxito.'));
                },
                onError: (errs) => {
                    info.revert();
                    notifyError((Object.values(errs)[0] as string) || __('No se pudo modificar la duración.'));
                },
            }
        );
    };

    const handleDateSelect = (selectInfo: any) => {
        const startIso = selectInfo.startStr.length > 19 ? selectInfo.startStr.substring(0, 19) : selectInfo.startStr;
        const start = selectInfo.start;
        const end = selectInfo.end;
        const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);

        handleCreateClick(startIso, diffMin > 0 ? diffMin : 30);
    };

    const handleDateClick = (arg: any) => {
        const startIso = arg.dateStr.includes('T') ? arg.dateStr.substring(0, 19) : `${arg.dateStr}T09:00:00`;
        handleCreateClick(startIso, 30);
    };

    const handleEventClick = (clickInfo: any) => {
        const citaId = Number(clickInfo.event.id);
        const foundCita = citas.find((c) => c.id === citaId) || clickInfo.event.extendedProps.cita;
        if (foundCita) {
            setSelectedCita(foundCita);
            setIsDetailModalOpen(true);
        }
    };

    const renderEventContent = (eventInfo: any) => {
        const props = eventInfo.event.extendedProps;
        const isList = eventInfo.view.type.startsWith('list');

        if (isList) {
            return (
                <div className="flex items-center gap-2 py-0.5 w-full">
                    <span className="font-bold text-xs text-foreground">{eventInfo.timeText}</span>
                    <span className="font-semibold text-xs text-foreground">{props.paciente_nombre}</span>
                    <span className="text-[11px] text-muted-foreground">({props.medico_nombre})</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-xs" style={{ backgroundColor: eventInfo.event.backgroundColor }}>
                        {props.estado_formateado}
                    </span>
                </div>
            );
        }

        return (
            <div className="p-1 w-full h-full text-white font-medium text-[11px] overflow-hidden flex flex-col justify-between leading-tight group/fc-event">
                <div className="bg-black/25 font-bold px-1.5 py-0.5 rounded text-[10px] truncate flex items-center justify-between">
                    <span className="truncate">{props.paciente_nombre}</span>
                    {props.link_virtual && <Video className="h-3 w-3 shrink-0 ml-1 text-blue-200" />}
                </div>
                <div className="opacity-95 text-[10px] font-semibold truncate mt-0.5">
                    {props.medico_nombre}
                </div>
                <div className="text-[9px] font-mono opacity-85 mt-0.5 flex items-center justify-between">
                    <span>{eventInfo.timeText}</span>
                    <span className="capitalize text-[9px] font-bold opacity-90">{props.estado_formateado}</span>
                </div>
            </div>
        );
    };

    const getSlotDurationString = (intervalMin: number) => {
        if (intervalMin === 60) return '01:00:00';
        return `00:${intervalMin < 10 ? '0' + intervalMin : intervalMin}:00`;
    };

    // ── Modal States ──────────────────────────────────────────────────────────
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
    const [editingCita, setEditingCita] = useState<Cita | null>(null);

    // ── Real-time Slots State ──────────────────────────────────────────────────
    const [availableSlots, setAvailableSlots] = useState<SlotDisponibilidad[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlotInicio, setSelectedSlotInicio] = useState<string>('');
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    // ── Form State ────────────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm({
        paciente_id: '',
        medico_id: '',
        especialidad_id: '',
        tipo_atencion_id: '',
        sucursal_id: '',
        fecha_reserva: new Date().toISOString().substring(0, 10),
        fecha_hora_inicio: '',
        duracion_minutos: 30,
        motivo_consulta: '',
        notas_recepcion: '',
        monto_estimado: '',
    });

    // ── Select2 Mapped Options ────────────────────────────────────────────────
    const pacienteSelectOptions: Select2Option[] = useMemo(() => {
        return pacientes.map((p) => ({
            value: p.id.toString(),
            label: p.tipo_paciente === 'animal' ? `🐾 ${p.nombre_mascota}` : `${p.nombres} ${p.apellidos}`,
            sublabel: p.tipo_paciente === 'animal' ? `Tutor: ${p.tutor_nombre}` : `Código: ${p.codigo_paciente} ${p.telefono ? '• Tel: ' + p.telefono : ''}`,
            badge: p.codigo_paciente,
            icon: p.tipo_paciente === 'animal' ? <PawPrint className="h-4 w-4 text-emerald-500" /> : <User className="h-4 w-4 text-blue-500" />,
        }));
    }, [pacientes]);

    const medicoSelectOptions: Select2Option[] = useMemo(() => {
        return medicos.map((m) => {
            const esp = especialidades.find((e) => e.id === m.especialidad_principal_id);
            return {
                value: m.id.toString(),
                label: `Dr(a). ${m.nombres} ${m.apellidos}`,
                sublabel: esp ? esp.nombre : 'Médico General',
                badge: m.codigo_medico,
                color: m.color_agenda || '#3b82f6',
            };
        });
    }, [medicos, especialidades]);

    const tipoAtencionSelectOptions: Select2Option[] = useMemo(() => {
        return tiposAtencion.map((t) => ({
            value: t.id.toString(),
            label: t.nombre,
            sublabel: `Duración: ${t.duracion_estimada_minutos} min • ${t.modalidad || 'Presencial'}`,
            badge: t.costo_adicional_sugerido ? `$${t.costo_adicional_sugerido}` : `${t.duracion_estimada_minutos}m`,
            icon: t.requiere_link_virtual ? <Video className="h-4 w-4 text-blue-500" /> : <Stethoscope className="h-4 w-4 text-emerald-500" />,
        }));
    }, [tiposAtencion]);

    const especialidadSelectOptions: Select2Option[] = useMemo(() => {
        return especialidades.map((e) => ({
            value: e.id.toString(),
            label: e.nombre,
            icon: <Stethoscope className="h-4 w-4 text-primary" />,
        }));
    }, [especialidades]);

    const medicoFilterOptions: Select2Option[] = useMemo(() => [
        { value: 'all', label: __('Todos los Médicos'), icon: <Users className="h-4 w-4 text-muted-foreground" /> },
        ...medicoSelectOptions,
    ], [medicoSelectOptions]);

    // ── Debounced Filtering ───────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({
                    search: searchTerm,
                    medico_id: medicoFilter,
                    especialidad_id: especialidadFilter,
                    tipo_atencion_id: tipoAtencionFilter,
                    estado: estadoFilter,
                }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, medicoFilter, especialidadFilter, tipoAtencionFilter, estadoFilter]);

    // ── Real-Time Slots Loader ────────────────────────────────────────────────
    const fetchAvailableSlots = async (medicoId: string, fechaStr: string, duracion: number) => {
        if (!medicoId || !fechaStr) {
            setAvailableSlots([]);
            return;
        }
        setIsLoadingSlots(true);
        try {
            const response = await fetch(`/admin/citas/slots?medico_id=${medicoId}&fecha=${fechaStr}&duracion_minutos=${duracion}`, {
                headers: { Accept: 'application/json' },
            });
            const result = await response.json();
            setAvailableSlots(result.slots || []);
        } catch (err) {
            console.error('Error fetching slots:', err);
            setAvailableSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (data.medico_id && data.fecha_reserva) {
            fetchAvailableSlots(data.medico_id, data.fecha_reserva, data.duracion_minutos);
        }
    }, [data.medico_id, data.fecha_reserva, data.duracion_minutos]);

    const filteredMedicoSelectOptions = useMemo(() => {
        if (!data.especialidad_id || data.especialidad_id === 'all') {
            return medicoSelectOptions;
        }
        return medicoSelectOptions.filter((m) => {
            const doc = medicos.find((docObj) => docObj.id.toString() === m.value);
            return doc?.especialidad_principal_id?.toString() === data.especialidad_id;
        });
    }, [medicoSelectOptions, medicos, data.especialidad_id]);

    const handleEspecialidadChange = (especialidadId: string) => {
        const docsInSpec = medicos.filter(
            (m) => !especialidadId || especialidadId === 'all' || m.especialidad_principal_id?.toString() === especialidadId
        );
        const isCurrentDocValid = docsInSpec.some((m) => m.id.toString() === data.medico_id);
        const newMedicoId = isCurrentDocValid
            ? data.medico_id
            : docsInSpec[0]?.id.toString() || '';

        setData((prev) => ({
            ...prev,
            especialidad_id: especialidadId,
            medico_id: newMedicoId,
            fecha_hora_inicio: '',
        }));
        setSelectedSlotInicio('');
    };

    const handleDoctorChange = (medicoId: string) => {
        const doc = medicos.find((m) => m.id.toString() === medicoId);
        setData((prev) => ({
            ...prev,
            medico_id: medicoId,
            especialidad_id: doc?.especialidad_principal_id ? doc.especialidad_principal_id.toString() : prev.especialidad_id,
            fecha_hora_inicio: '',
        }));
        setSelectedSlotInicio('');
    };

    const handleCareTypeChange = (tipoId: string) => {
        const tipo = tiposAtencion.find((t) => t.id.toString() === tipoId);
        const duracion = tipo?.duracion_estimada_minutos || 30;
        const costo = tipo?.costo_adicional_sugerido ? tipo.costo_adicional_sugerido.toString() : '';

        setData((prev) => ({
            ...prev,
            tipo_atencion_id: tipoId,
            duracion_minutos: duracion,
            monto_estimado: costo,
            fecha_hora_inicio: '',
        }));
        setSelectedSlotInicio('');
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setMedicoFilter('all');
        setEspecialidadFilter('all');
        setTipoAtencionFilter('all');
        setEstadoFilter('all');
    };

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCreateClick = (slotTime?: string, duracionMin: number = 30) => {
        setEditingCita(null);
        reset();
        const defaultMedico = medicos[0]?.id.toString() || '';
        const defaultTipo = tiposAtencion[0]?.id.toString() || '';
        const defaultDocObj = medicos[0];

        const initialFecha = slotTime
            ? slotTime.substring(0, 10)
            : currentDate.toISOString().substring(0, 10);

        setData({
            paciente_id: pacientes[0]?.id.toString() || '',
            medico_id: defaultMedico,
            especialidad_id: defaultDocObj?.especialidad_principal_id?.toString() || especialidades[0]?.id.toString() || '',
            tipo_atencion_id: defaultTipo,
            sucursal_id: sucursales[0]?.id.toString() || '',
            fecha_reserva: initialFecha,
            fecha_hora_inicio: slotTime || '',
            duracion_minutos: duracionMin || tiposAtencion[0]?.duracion_estimada_minutos || 30,
            motivo_consulta: '',
            notas_recepcion: '',
            monto_estimado: tiposAtencion[0]?.costo_adicional_sugerido?.toString() || '50',
        });
        setSelectedSlotInicio(slotTime || '');
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.fecha_hora_inicio) {
            notifyError(__('Por favor selecciona un turno/horario disponible.'));
            return;
        }

        if (editingCita) {
            put(`/admin/citas/${editingCita.id}`, {
                preserveScroll: true,
                onSuccess: () => setIsCreateModalOpen(false),
                onError: (errs) => notifyError((Object.values(errs)[0] as string) || __('Por favor revisa los campos.')),
            });
        } else {
            post('/admin/citas', {
                preserveScroll: true,
                onSuccess: () => setIsCreateModalOpen(false),
                onError: (errs) => notifyError((Object.values(errs)[0] as string) || __('Por favor revisa los campos.')),
            });
        }
    };

    // Sincronizar selectedCita cuando cambia la lista de citas sin cerrar el modal
    useEffect(() => {
        if (selectedCita) {
            const updated = citas.find((c) => c.id === selectedCita.id);
            if (updated) {
                setSelectedCita(updated);
            }
        }
    }, [citas]);

    const handleQuickStateChange = (cita: Cita, nuevoEstado: string) => {
        if (nuevoEstado === 'cancelada') {
            setSelectedCita(cita);
            setMotivoCancelacion('');
            setIsCancelModalOpen(true);
            return;
        }

        // Actualización optimista de estado local para respuesta UI instantánea
        const estadoFormateadoMap: Record<string, string> = {
            pendiente: 'Pendiente',
            confirmada_pagada: 'Confirmada / Pagada',
            en_sala_espera: 'En Sala de Espera',
            en_consulta: 'En Consultorio',
            atendida: 'Atendida',
            cancelada: 'Cancelada',
        };

        setSelectedCita((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                estado: nuevoEstado as any,
                estado_formateado: estadoFormateadoMap[nuevoEstado] || nuevoEstado,
            };
        });

        router.patch(
            `/admin/citas/${cita.id}/estado`,
            { estado: nuevoEstado },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    notifySuccess(__('Estado de la cita actualizado correctamente.'));
                },
                onError: () => {
                    notifyError(__('No se pudo actualizar el estado de la cita.'));
                },
            }
        );
    };

    const handleConfirmCancel = () => {
        if (!selectedCita) return;
        if (!motivoCancelacion.trim()) {
            notifyError(__('Ingresa un motivo de cancelación.'));
            return;
        }

        setSelectedCita((prev) => (prev ? { ...prev, estado: 'cancelada', estado_formateado: 'Cancelada' } : null));

        router.patch(
            `/admin/citas/${selectedCita.id}/estado`,
            { estado: 'cancelada', motivo_cancelacion: motivoCancelacion },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsCancelModalOpen(false);
                    notifySuccess(__('Cita cancelada correctamente.'));
                },
                onError: (errs) => notifyError((Object.values(errs)[0] as string) || __('No se pudo cancelar.')),
            }
        );
    };

    const handleSendWhatsApp = (cita: Cita) => {
        router.post(`/admin/citas/${cita.id}/send-whatsapp-reminder`, {}, { preserveScroll: true });
    };

    const handleDeleteCita = (cita: Cita) => {
        if (confirm(__('¿Estás seguro de eliminar esta cita?'))) {
            router.delete(`/admin/citas/${cita.id}`, {
                preserveScroll: true,
                onSuccess: () => setIsDetailModalOpen(false),
            });
        }
    };

    // Helper estado badge
    const getBadgeVariant = (estado: string) => {
        switch (estado) {
            case 'confirmada_pagada':
                return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
            case 'pendiente':
                return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
            case 'en_sala_espera':
                return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
            case 'en_consulta':
                return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30';
            case 'atendida':
                return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30';
            case 'cancelada':
                return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
            default:
                return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30';
        }
    };

    // ── Native Weekly Date Range Helpers ─────────────────────────────────────
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunes start
        return new Date(date.setDate(diff));
    };

    const getWeekDays = (start: Date) => {
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    };

    const formatLocalDate = (d: Date | string) => {
        if (!d) return '';
        const dateObj = typeof d === 'string' ? new Date(d.replace(' ', 'T')) : d;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = getWeekDays(startOfWeek);

    const navigateDate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }

        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const hoursRange = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 AM to 6:00 PM

    return (
        <div className="space-y-6">
            {/* Header del Módulo */}
            <ModuleHeader
                title={__('Agenda Médica & Citas')}
                description={__('Gestión de citas médicas en tiempo real, control de sobre-reservas y estado de atención.')}
                icon={<CalendarIcon className="h-6 w-6" />}
                action={
                    <Button onClick={() => handleCreateClick()} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                        <Plus className="h-4 w-4 mr-2" />
                        {__('Agendar Nueva Cita')}
                    </Button>
                }
            />

            {/* Tarjetas de Estadísticas del Día */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title={__('Citas Hoy')}
                    value={estadisticas.citas_hoy.toString()}
                    icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
                    description={__('Total programadas')}
                />
                <StatCard
                    title={__('Confirmadas / Pagadas')}
                    value={estadisticas.confirmadas.toString()}
                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                    description={__('Listas para atención')}
                />
                <StatCard
                    title={__('En Sala de Espera')}
                    value={estadisticas.en_sala_espera.toString()}
                    icon={<Users className="h-5 w-5 text-blue-500" />}
                    description={__('Recepcionados')}
                />
                <StatCard
                    title={__('En Consulta')}
                    value={estadisticas.en_consulta.toString()}
                    icon={<Stethoscope className="h-5 w-5 text-purple-600" />}
                    description={__('Con el profesional')}
                />
                <StatCard
                    title={__('Atendidas')}
                    value={estadisticas.atendidas.toString()}
                    icon={<UserCheck className="h-5 w-5 text-orange-600" />}
                    description={__('Concluidas hoy')}
                />
                <StatCard
                    title={__('Canceladas')}
                    value={estadisticas.canceladas.toString()}
                    icon={<AlertCircle className="h-5 w-5 text-rose-600" />}
                    description={__('Canceladas / Inasistidas')}
                />
            </div>

            {/* Estructura Principal de 2 Columnas estilo Referencia (Sidebar Filtros + Calendario) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Panel Lateral de Filtros & Mini Calendario */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="p-4 bg-card rounded-2xl border shadow-xs space-y-4">
                        <Button
                            onClick={() => handleCreateClick()}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-11 font-bold shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {__('Nueva Cita')}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="w-full rounded-xl text-xs text-muted-foreground h-9"
                        >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            {__('Limpiar Filtros')}
                        </Button>

                        <div className="space-y-3 pt-2 border-t">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">{__('Médico')}</Label>
                                <Select2
                                    options={medicoFilterOptions}
                                    value={medicoFilter}
                                    onChange={setMedicoFilter}
                                    placeholder={__('Todos los médicos')}
                                    size="sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">{__('Paciente')}</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={__('Buscar paciente...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 h-9 rounded-xl text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mini Calendario Interactivo */}
                        <div className="pt-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">{__('Navegación por Fecha')}</Label>
                            <MiniCalendar
                                selectedDate={currentDate}
                                onSelectDate={handleMiniCalendarSelect}
                            />
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Calendario Principal FullCalendar */}
                <div className="lg:col-span-9 space-y-4">
                    {/* Barra Superior del Calendario */}
                    <div className="p-3 bg-card rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4">
                        {/* Controles de Navegación */}
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleNavigate('today')} className="h-9 px-3 rounded-xl font-semibold text-xs">
                                {__('Hoy')}
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')} className="h-9 w-9 rounded-xl">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleNavigate('next')} className="h-9 w-9 rounded-xl">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-bold text-foreground capitalize pl-2">
                                {calendarTitle || currentDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Controles de Vista e Intervalo */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Selector de Vista (Día, Semana, Mes, Lista) */}
                            <div className="flex items-center space-x-1 bg-muted p-1 rounded-xl">
                                <Button
                                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('day')}
                                    className="rounded-lg h-7 text-xs px-3"
                                >
                                    {__('Día')}
                                </Button>
                                <Button
                                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('week')}
                                    className="rounded-lg h-7 text-xs px-3"
                                >
                                    {__('Semana')}
                                </Button>
                                <Button
                                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('month')}
                                    className="rounded-lg h-7 text-xs px-3"
                                >
                                    {__('Mes')}
                                </Button>
                                <Button
                                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handleViewModeChange('table')}
                                    className="rounded-lg h-7 text-xs px-3"
                                >
                                    {__('Lista')}
                                </Button>
                            </div>

                            {/* Selector de Intervalo */}
                            <div className="flex items-center space-x-1.5 border-l pl-3">
                                <span className="text-xs text-muted-foreground font-semibold">{__('Intervalo:')}</span>
                                <Select value={slotInterval.toString()} onValueChange={(val) => setSlotInterval(Number(val))}>
                                    <SelectTrigger className="h-8 rounded-xl text-xs w-[90px] bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="20">20 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="60">60 min</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Leyenda de Colores */}
                    <div className="flex flex-wrap items-center gap-4 text-xs p-3 bg-card rounded-2xl border shadow-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{__('Estados de Cita:')}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> 🟢 Confirmada/Pagada</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> 🟡 Pendiente</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> 🔵 En Sala de Espera</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span> 🟣 En Consulta</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> 🟠 Atendida</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> 🔴 Cancelada</span>
                    </div>

                    {/* Contenedor de FullCalendar */}
                    <div className="bg-card rounded-2xl border shadow-xs p-4 overflow-hidden fullcalendar-custom-container">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin] as any}
                            initialView={viewMode === 'day' ? 'timeGridDay' : viewMode === 'month' ? 'dayGridMonth' : viewMode === 'table' ? 'listMonth' : 'timeGridWeek'}
                            locale={esLocale as any}
                            headerToolbar={false}
                            events={fullCalendarEvents}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            nowIndicator={true}
                            slotDuration={getSlotDurationString(slotInterval)}
                            slotMinTime="07:00:00"
                            slotMaxTime="21:00:00"
                            allDaySlot={false}
                            datesSet={handleDatesSet}
                            eventDrop={handleEventDrop}
                            eventResize={handleEventResize}
                            select={handleDateSelect}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            eventContent={renderEventContent}
                            height="auto"
                        />
                    </div>

                    {/* Vista Tabla Completa */}
                    {viewMode === 'table' && (
                        <div className="p-4 bg-card rounded-2xl border shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">{__('Código')}</th>
                                            <th className="px-4 py-3">{__('Paciente')}</th>
                                            <th className="px-4 py-3">{__('Médico / Especialidad')}</th>
                                            <th className="px-4 py-3">{__('Fecha y Hora')}</th>
                                            <th className="px-4 py-3">{__('Tipo / Modalidad')}</th>
                                            <th className="px-4 py-3">{__('Estado')}</th>
                                            <th className="px-4 py-3 text-right">{__('Acciones')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {citas.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    {__('No se encontraron citas médicas en este rango.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            citas.map((c) => (
                                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-medium">{c.codigo_cita}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-foreground">
                                                            {c.paciente?.tipo_paciente === 'animal'
                                                                ? `🐾 ${c.paciente.nombre_mascota}`
                                                                : `👤 ${c.paciente?.nombres} ${c.paciente?.apellidos}`}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {c.paciente?.tipo_paciente === 'animal'
                                                                ? `Tutor: ${c.paciente.tutor_nombre}`
                                                                : `CI: ${c.paciente?.codigo_paciente}`}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-foreground">
                                                            Dr(a). {c.medico?.nombres} {c.medico?.apellidos}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {c.especialidad?.nombre || 'General'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-foreground">
                                                            {new Date(c.fecha_hora_inicio.replace(' ', 'T')).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(c.fecha_hora_inicio.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.duracion_minutos} min)
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium">{c.tipoAtencion?.nombre || 'Consulta'}</span>
                                                        {c.link_virtual && (
                                                            <a href={c.link_virtual} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline">
                                                                💻 Link Virtual
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className={getBadgeVariant(c.estado)}>
                                                            {c.estado_formateado}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedCita(c);
                                                                setIsDetailModalOpen(true);
                                                            }}
                                                        >
                                                            {__('Ver Detalle')}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Agendar / Editar Cita */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="w-full sm:max-w-5xl rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] p-6 md:p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                            {editingCita ? __('Editar Cita Médica') : __('Agendar Nueva Cita Médica')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Columna Izquierda: Información Principal del Paciente y Atención */}
                            <div className="lg:col-span-6 space-y-4">
                                {/* Paciente */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground">{__('Paciente *')}</Label>
                                    <Select2
                                        options={pacienteSelectOptions}
                                        value={data.paciente_id}
                                        onChange={(val) => setData('paciente_id', val)}
                                        placeholder={__('Seleccionar paciente...')}
                                        searchPlaceholder={__('Buscar por nombre, código o tutor...')}
                                    />
                                    {errors.paciente_id && <p className="text-xs text-rose-500 font-medium">{errors.paciente_id}</p>}
                                </div>

                                {/* Especialidad Médica */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground">{__('Especialidad Médica')}</Label>
                                    <Select2
                                        options={especialidadSelectOptions}
                                        value={data.especialidad_id}
                                        onChange={handleEspecialidadChange}
                                        placeholder={__('Todas las especialidades...')}
                                        searchPlaceholder={__('Buscar especialidad...')}
                                    />
                                    {errors.especialidad_id && <p className="text-xs text-rose-500 font-medium">{errors.especialidad_id}</p>}
                                </div>

                                {/* Médico Tratante */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground">{__('Médico Tratante *')}</Label>
                                    <Select2
                                        options={filteredMedicoSelectOptions}
                                        value={data.medico_id}
                                        onChange={handleDoctorChange}
                                        placeholder={__('Seleccionar médico...')}
                                        searchPlaceholder={__('Buscar médico por nombre o especialidad...')}
                                    />
                                    {errors.medico_id && <p className="text-xs text-rose-500 font-medium">{errors.medico_id}</p>}
                                </div>

                                {/* Tipo de Atención */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground">{__('Tipo de Atención *')}</Label>
                                    <Select2
                                        options={tipoAtencionSelectOptions}
                                        value={data.tipo_atencion_id}
                                        onChange={handleCareTypeChange}
                                        placeholder={__('Seleccionar tipo de atención...')}
                                        searchPlaceholder={__('Buscar tipo de atención...')}
                                    />
                                    {errors.tipo_atencion_id && <p className="text-xs text-rose-500 font-medium">{errors.tipo_atencion_id}</p>}
                                </div>

                                {/* Motivo de Consulta */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-foreground">{__('Motivo de Consulta / Síntomas')}</Label>
                                    <Textarea
                                        placeholder={__('Describa brevemente el motivo o síntomas...')}
                                        value={data.motivo_consulta}
                                        onChange={(e) => setData('motivo_consulta', e.target.value)}
                                        className="rounded-2xl min-h-[90px] resize-none"
                                    />
                                </div>
                            </div>

                            {/* Columna Derecha: Selección Dinámica de Fecha y Turnos sin Overbooking */}
                            <div className="lg:col-span-6 space-y-4 bg-muted/30 p-6 rounded-3xl border shadow-inner">
                                <div className="space-y-2">
                                    <Label className="font-bold text-foreground text-sm flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        {__('1. Seleccionar Fecha de Cita *')}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.fecha_reserva}
                                        min={new Date().toISOString().substring(0, 10)}
                                        onChange={(e) => setData('fecha_reserva', e.target.value)}
                                        className="h-11 rounded-xl bg-background border font-medium text-foreground"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-foreground text-sm flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            {__('2. Turnos / Horarios Disponibles *')}
                                        </Label>
                                        {isLoadingSlots && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                                    </div>

                                    {availableSlots.length === 0 ? (
                                        <div className="p-4 border-2 border-dashed rounded-2xl bg-background space-y-3">
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                <AlertCircle className="h-5 w-5 shrink-0" />
                                                <span className="text-xs font-semibold">
                                                    {isLoadingSlots
                                                        ? __('Calculando huecos disponibles...')
                                                        : __('Sin turnos automáticos en esta fecha (regla 2h anticipación / descanso).')}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t space-y-1.5">
                                                <Label className="text-xs font-semibold text-muted-foreground">{__('Establecer hora manual (Recepción):')}</Label>
                                                <Input
                                                    type="time"
                                                    onChange={(e) => {
                                                        const manualIso = `${data.fecha_reserva}T${e.target.value}:00`;
                                                        setSelectedSlotInicio(manualIso);
                                                        setData('fecha_hora_inicio', manualIso);
                                                    }}
                                                    className="h-10 rounded-xl bg-muted/20 text-xs"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                                            {availableSlots.map((slot, idx) => {
                                                const isSelected = selectedSlotInicio === slot.inicio;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSlotInicio(slot.inicio);
                                                            setData('fecha_hora_inicio', slot.inicio);
                                                        }}
                                                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-95'
                                                                : 'bg-background hover:border-primary/50 text-foreground'
                                                            }`}
                                                    >
                                                        {slot.hora_inicio_formateada}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {errors.fecha_hora_inicio && (
                                        <p className="text-xs text-rose-500 font-medium">{errors.fecha_hora_inicio}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">{__('Monto Estimado ($)')}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={data.monto_estimado}
                                            onChange={(e) => setData('monto_estimado', e.target.value)}
                                            className="h-11 rounded-xl bg-background border font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-foreground">{__('Duración Total (min)')}</Label>
                                        <Input
                                            type="number"
                                            value={data.duracion_minutos}
                                            onChange={(e) => setData('duracion_minutos', parseInt(e.target.value) || 30)}
                                            className="h-11 rounded-xl bg-background border font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl px-5 h-11">
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={processing || !data.fecha_hora_inicio} className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-11 font-bold">
                                {editingCita ? __('Guardar Cambios') : __('Confirmar Cita Médica')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Detalle y Acciones Rápidas de Cita */}
            {selectedCita && (
                <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                    <DialogContent className="w-full sm:max-w-2xl rounded-3xl p-6 shadow-2xl border-0">
                        <DialogHeader className="pb-2 border-b">
                            <div className="flex items-center justify-between pr-4">
                                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Stethoscope className="size-5 text-indigo-600" />
                                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCita.codigo_cita}</span>
                                </DialogTitle>
                                <Badge className={cn("text-xs font-bold px-3 py-1 rounded-xl shadow-xs", getBadgeVariant(selectedCita.estado))}>
                                    {selectedCita.estado_formateado}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5 py-2">
                            {/* Datos del Paciente y Médico en Tarjetas Elegantes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border flex items-start gap-3">
                                    <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 font-extrabold text-sm">
                                        {selectedCita.paciente?.tipo_paciente === 'animal' ? '🐾' : <User className="size-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">{__('Paciente')}</span>
                                        <span className="font-extrabold text-xs text-foreground block truncate">
                                            {selectedCita.paciente?.tipo_paciente === 'animal'
                                                ? selectedCita.paciente.nombre_mascota
                                                : `${selectedCita.paciente?.nombres} ${selectedCita.paciente?.apellidos}`}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-medium block">
                                            Tel: {selectedCita.paciente?.telefono || selectedCita.paciente?.tutor_telefono || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border flex items-start gap-3">
                                    <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold text-sm">
                                        <Stethoscope className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">{__('Médico Tratante')}</span>
                                        <span className="font-extrabold text-xs text-foreground block truncate">
                                            Dr(a). {selectedCita.medico?.nombres} {selectedCita.medico?.apellidos}
                                        </span>
                                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">
                                            {selectedCita.especialidad?.nombre || 'Medicina General'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fecha, Hora y Telemedicina */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border text-xs">
                                    <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-indigo-600" />
                                        {new Date(selectedCita.fecha_hora_inicio.replace(' ', 'T')).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                    </span>
                                    <span className="font-extrabold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                                        ${selectedCita.monto_estimado} USD
                                    </span>
                                </div>

                                {selectedCita.link_virtual && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Video className="h-5 w-5 text-blue-600" />
                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Consulta Virtual Activa</span>
                                        </div>
                                        <a
                                            href={selectedCita.link_virtual}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold transition-colors shadow-sm"
                                        >
                                            Unirse a Videollamada
                                        </a>
                                    </div>
                                )}

                                {selectedCita.motivo_consulta && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 block">{__('Motivo de Consulta:')}</span>
                                        <p className="text-xs font-medium bg-background p-3 rounded-2xl border text-slate-800 dark:text-slate-200">
                                            {selectedCita.motivo_consulta}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* FLUJO CLÍNICO - STEPPER VISUAL INTERACTIVO */}
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        {__('Flujo Clínico (Progreso de la Cita)')}
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                        {selectedCita.estado_formateado}
                                    </span>
                                </div>

                                <div className="grid grid-cols-5 gap-1.5 pt-1">
                                    {[
                                        { key: 'pendiente', label: 'Pendiente', color: 'bg-amber-500' },
                                        { key: 'confirmada_pagada', label: 'Confirmada', color: 'bg-emerald-500' },
                                        { key: 'en_sala_espera', label: 'Recepción', color: 'bg-blue-500' },
                                        { key: 'en_consulta', label: 'En Consulta', color: 'bg-purple-500' },
                                        { key: 'atendida', label: 'Atendida', color: 'bg-teal-500' },
                                    ].map((step, idx) => {
                                        const currentIdx = ['pendiente', 'confirmada_pagada', 'en_sala_espera', 'en_consulta', 'atendida'].indexOf(selectedCita.estado);
                                        const isCurrent = selectedCita.estado === step.key;
                                        const isPassed = currentIdx > idx;

                                        return (
                                            <button
                                                key={step.key}
                                                type="button"
                                                onClick={() => handleQuickStateChange(selectedCita, step.key)}
                                                className={cn(
                                                    "p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5",
                                                    isCurrent && "bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs scale-105",
                                                    isPassed && "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-85",
                                                    !isCurrent && !isPassed && "bg-background border-dashed opacity-60 hover:opacity-100 hover:border-solid"
                                                )}
                                            >
                                                <div className={cn("size-3 rounded-full transition-transform", isCurrent || isPassed ? step.color : "bg-slate-300")} />
                                                <span className={cn("text-[10px] font-bold block truncate w-full", isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400")}>
                                                    {step.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* HERO ACTION BUTTON & ACCIONES RÁPIDAS */}
                            <div className="space-y-3 pt-1">
                                {/* Botón Acción Principal Destacado */}
                                <Button
                                    type="button"
                                    onClick={() => router.get(`/admin/citas/${selectedCita.id}/atencion`)}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
                                >
                                    <Stethoscope className="size-4" />
                                    {__('ATENDER CONSULTA MÉDICA (WIZARD DE ATENCIÓN)')}
                                    <ArrowRight className="size-4 ml-1" />
                                </Button>

                                {/* Barra de Herramientas Secundarias */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {/* Select para cambio de estado rápido */}
                                    <Select
                                        value={selectedCita.estado}
                                        onValueChange={(val) => handleQuickStateChange(selectedCita, val)}
                                    >
                                        <SelectTrigger className="h-10 text-xs font-bold rounded-xl border bg-background w-full">
                                            <SelectValue placeholder={__('Cambiar Estado...')} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="pendiente" className="text-xs font-bold">🟡 Pendiente</SelectItem>
                                            <SelectItem value="confirmada_pagada" className="text-xs font-bold">🟢 Confirmada / Pagado</SelectItem>
                                            <SelectItem value="en_sala_espera" className="text-xs font-bold">🔵 Llegó a Recepción</SelectItem>
                                            <SelectItem value="en_consulta" className="text-xs font-bold">🟣 En Consultorio</SelectItem>
                                            <SelectItem value="atendida" className="text-xs font-bold">🟠 Atendida / Finalizada</SelectItem>
                                            <SelectItem value="cancelada" className="text-xs font-bold text-rose-600">🔴 Cancelar Cita</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Cuestionario Pre-Consulta */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                const res = await fetch(`/admin/citas/${selectedCita.id}/generar-preconsulta`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                                                    },
                                                });
                                                const data = await res.json();
                                                if (data.url) {
                                                    navigator.clipboard.writeText(data.url);
                                                    notifySuccess(__('¡Link de Pre-Consulta copiado al portapapeles!'));
                                                    window.open(data.url, '_blank');
                                                }
                                            } catch (err) {
                                                notifyError(__('No se pudo generar el enlace de preconsulta.'));
                                            }
                                        }}
                                        className="h-10 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/10 rounded-xl font-bold text-xs gap-1.5"
                                    >
                                        📋 {__('Pre-Consulta')}
                                    </Button>

                                    {/* Recordatorio WhatsApp */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendWhatsApp(selectedCita)}
                                        className="h-10 border-green-600/40 text-green-700 dark:text-green-400 hover:bg-green-600/10 rounded-xl font-bold text-xs gap-1.5"
                                    >
                                        📱 {__('WhatsApp')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t pt-4">
                            <Button variant="ghost" onClick={() => handleDeleteCita(selectedCita)} className="text-rose-500 hover:bg-rose-500/10 rounded-xl mr-auto font-bold text-xs h-10 px-4">
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                {__('Eliminar Cita')}
                            </Button>
                            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl font-bold text-xs h-10 px-5">
                                {__('Cerrar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal: Cancelación con Motivo */}
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <DialogContent className="w-full sm:max-w-md rounded-3xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {__('Cancelar Cita Médica')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <p className="text-xs text-muted-foreground">
                            {__('Atención: La regla del sistema exige un margen de 24 horas para cancelaciones. Si faltan menos de 24 horas, se aplicará restricción.')}
                        </p>
                        <div className="space-y-2">
                            <Label>{__('Motivo de Cancelación *')}</Label>
                            <Textarea
                                placeholder={__('Ingresa el motivo por el cual el paciente o la clínica cancela la cita...')}
                                value={motivoCancelacion}
                                onChange={(e) => setMotivoCancelacion(e.target.value)}
                                className="rounded-xl min-h-[90px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 border-t pt-4">
                        <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="rounded-xl">
                            {__('Volver')}
                        </Button>
                        <Button onClick={handleConfirmCancel} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                            {__('Confirmar Cancelación')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
