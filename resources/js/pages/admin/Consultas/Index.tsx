import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
    Stethoscope,
    Users,
    Clock,
    CheckCircle2,
    Play,
    FileText,
    Sparkles,
    Calendar,
    Search,
    X,
    Pill,
    Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    DialogDescription,
} from '@/components/ui/dialog';

interface Consulta {
    id: number;
    estado: 'sala_de_espera' | 'en_consultorio' | 'finalizada';
    motivo_consulta?: string;
    diagnostico_cie10_nombre?: string;
    finalizada_at?: string;
    created_at: string;
    medico_id: number;
    especialidad_id?: number;
    cita: {
        id: number;
        codigo_cita: string;
        fecha_hora_inicio: string;
        preconsulta?: {
            completado: boolean;
            respuestas?: Record<string, any>;
            plantilla?: {
                titulo: string;
            };
        };
    };
    paciente: {
        id: number;
        codigo_paciente: string;
        nombres: string;
        apellidos: string;
        nombre_mascota?: string;
        tipo_paciente: string;
    };
    medico: {
        id: number;
        nombres: string;
        apellidos: string;
        color_agenda?: string;
    };
    especialidad?: {
        id: number;
        nombre: string;
        color?: string;
    };
    receta?: {
        id: number;
        medicamentos?: any[];
    };
}

interface MedicoOption {
    id: number;
    nombres: string;
    apellidos: string;
}

interface EspecialidadOption {
    id: number;
    nombre: string;
}

interface Props {
    salaDeEspera: Consulta[];
    enConsultorio: Consulta[];
    finalizadas: Consulta[];
    medicos: MedicoOption[];
    especialidades: EspecialidadOption[];
    focusedTab?: string;
}

export default function ConsultasIndex({
    salaDeEspera = [],
    enConsultorio = [],
    finalizadas = [],
    medicos = [],
    especialidades = [],
}: Props) {
    const __ = (key: string) => key;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedico, setSelectedMedico] = useState<string>('all');
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>('all');
    const [previewPreconsulta, setPreviewPreconsulta] = useState<Consulta | null>(null);

    // Filtrar consultas de cada columna según la búsqueda
    const filterItems = (items: Consulta[]) => {
        return items.filter((item) => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const paciente = `${item.paciente?.nombres} ${item.paciente?.apellidos} ${item.paciente?.nombre_mascota || ''}`.toLowerCase();
                const codigo = (item.cita?.codigo_cita || '').toLowerCase();
                const motivo = (item.motivo_consulta || '').toLowerCase();
                const dx = (item.diagnostico_cie10_nombre || '').toLowerCase();

                if (!paciente.includes(term) && !codigo.includes(term) && !motivo.includes(term) && !dx.includes(term)) {
                    return false;
                }
            }

            if (selectedMedico !== 'all' && String(item.medico_id) !== selectedMedico) {
                return false;
            }

            if (selectedEspecialidad !== 'all' && String(item.especialidad_id) !== selectedEspecialidad) {
                return false;
            }

            return true;
        });
    };

    const salaFiltrada = useMemo(() => filterItems(salaDeEspera), [salaDeEspera, searchTerm, selectedMedico, selectedEspecialidad]);
    const consultorioFiltrado = useMemo(() => filterItems(enConsultorio), [enConsultorio, searchTerm, selectedMedico, selectedEspecialidad]);
    const finalizadasFiltradas = useMemo(() => filterItems(finalizadas), [finalizadas, searchTerm, selectedMedico, selectedEspecialidad]);

    return (
        <div className="w-full space-y-6">

            {/* Header Limpio & Elegante */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                        <Stethoscope className="size-7 text-primary" />
                        {__('Consultas Médicas')}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        {__('Tablero kanban en tiempo real: Pacientes en espera, atención en consultorio y atenciones concluidas.')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => router.get('/admin/citas')} variant="outline" className="rounded-xl text-xs font-bold gap-2">
                        <Calendar className="size-4 text-primary" />
                        {__('Agenda Médica')}
                    </Button>
                </div>
            </div>

            {/* Barra de Filtros Inteligentes */}
            <div className="p-3 bg-card rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={__('Buscar paciente, código o diagnóstico...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <Select value={selectedMedico} onValueChange={setSelectedMedico}>
                        <SelectTrigger className="h-9 w-full sm:w-44 text-xs rounded-xl">
                            <SelectValue placeholder={__('Todos los Médicos')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{__('Todos los Médicos')}</SelectItem>
                            {medicos.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                    Dr(a). {m.nombres} {m.apellidos}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedEspecialidad} onValueChange={setSelectedEspecialidad}>
                        <SelectTrigger className="h-9 w-full sm:w-48 text-xs rounded-xl">
                            <SelectValue placeholder={__('Todas las Especialidades')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{__('Todas las Especialidades')}</SelectItem>
                            {especialidades.map((e) => (
                                <SelectItem key={e.id} value={String(e.id)}>
                                    {e.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(searchTerm || selectedMedico !== 'all' || selectedEspecialidad !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedMedico('all');
                                setSelectedEspecialidad('all');
                            }}
                            className="h-9 text-xs text-rose-500 hover:text-rose-600 rounded-xl"
                        >
                            <X className="size-3.5 mr-1" />
                            {__('Limpiar Filtros')}
                        </Button>
                    )}
                </div>
            </div>

            {/* TABLERO KANBAN DE 3 COLUMNAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* COLUMNA 1: 🔵 Sala de Espera */}
                <div className="space-y-4 bg-muted/20 p-4 rounded-3xl border border-border/50 min-h-[500px]">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-blue-500" />
                            <h3 className="font-extrabold text-sm text-foreground">{__('Sala de Espera')}</h3>
                        </div>
                        <Badge className="bg-blue-500 text-white font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                            {salaFiltrada.length}
                        </Badge>
                    </div>

                    {salaFiltrada.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground/60 space-y-2">
                            <Clock className="size-8 mx-auto opacity-40" />
                            <p className="text-xs font-semibold">{__('Sin pacientes en sala de espera')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {salaFiltrada.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-card rounded-2xl border shadow-2xs hover:shadow-md transition-all space-y-3 border-l-4 border-l-blue-500 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 font-mono text-[10px] border-blue-500/20">
                                            {item.cita.codigo_cita}
                                        </Badge>
                                        {item.cita.preconsulta?.completado && (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewPreconsulta(item)}
                                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all"
                                            >
                                                <Sparkles className="size-3 text-emerald-600" />
                                                {__('Pre-Consulta Llenada')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                            {item.paciente?.tipo_paciente === 'animal' ? '🐾' : '👤'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.paciente?.tipo_paciente === 'animal'
                                                    ? `${item.paciente.nombre_mascota}`
                                                    : `${item.paciente?.nombres} ${item.paciente?.apellidos}`}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Dr(a). {item.medico?.nombres} {item.medico?.apellidos} • <span className="text-primary font-semibold">{item.especialidad?.nombre || 'General'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {item.motivo_consulta && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-xl border">
                                            {item.motivo_consulta}
                                        </p>
                                    )}

                                    <Button
                                        onClick={() => router.get(`/admin/consultas/${item.cita.id}/atencion`)}
                                        className="w-full rounded-xl font-extrabold bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs shadow-sm gap-1.5"
                                    >

                                        <Play className="size-3.5 fill-white" />
                                        {__('Llamar a Consultorio')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA 2: 🟣 En Consultorio */}
                <div className="space-y-4 bg-muted/20 p-4 rounded-3xl border border-border/50 min-h-[500px]">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-purple-500" />
                            <h3 className="font-extrabold text-sm text-foreground">{__('En Consultorio')}</h3>
                        </div>
                        <Badge className="bg-purple-500 text-white font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                            {consultorioFiltrado.length}
                        </Badge>
                    </div>

                    {consultorioFiltrado.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground/60 space-y-2">
                            <Stethoscope className="size-8 mx-auto opacity-40" />
                            <p className="text-xs font-semibold">{__('Sin atenciones activas')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {consultorioFiltrado.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-card rounded-2xl border shadow-2xs hover:shadow-md transition-all space-y-3 border-l-4 border-l-purple-500 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 font-mono text-[10px] border-purple-500/20">
                                            {item.cita.codigo_cita}
                                        </Badge>
                                        <Badge className="bg-purple-500 text-white text-[9px] font-bold animate-pulse">
                                            {__('En Atención')}
                                        </Badge>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                                            {item.paciente?.tipo_paciente === 'animal' ? '🐾' : '👤'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.paciente?.tipo_paciente === 'animal'
                                                    ? `${item.paciente.nombre_mascota}`
                                                    : `${item.paciente?.nombres} ${item.paciente?.apellidos}`}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Dr(a). {item.medico?.nombres} {item.medico?.apellidos} • <span className="text-primary font-semibold">{item.especialidad?.nombre || 'General'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => router.get(`/admin/citas/${item.cita.id}/atencion`)}
                                        className="w-full rounded-xl font-extrabold bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs shadow-sm gap-1.5"
                                    >
                                        <Stethoscope className="size-3.5" />
                                        {__('Continuar Atención (Wizard)')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA 3: 🟢 Finalizadas (Hoy) */}
                <div className="space-y-4 bg-muted/20 p-4 rounded-3xl border border-border/50 min-h-[500px]">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-emerald-500" />
                            <h3 className="font-extrabold text-sm text-foreground">{__('Finalizadas (Hoy)')}</h3>
                        </div>
                        <Badge className="bg-emerald-500 text-white font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                            {finalizadasFiltradas.length}
                        </Badge>
                    </div>

                    {finalizadasFiltradas.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground/60 space-y-2">
                            <CheckCircle2 className="size-8 mx-auto opacity-40" />
                            <p className="text-xs font-semibold">{__('Sin consultas finalizadas hoy')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {finalizadasFiltradas.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-card rounded-2xl border shadow-2xs hover:shadow-md transition-all space-y-3 border-l-4 border-l-emerald-500 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 font-mono text-[10px] border-emerald-500/20">
                                            {item.cita.codigo_cita}
                                        </Badge>
                                        <Badge className="bg-emerald-500 text-white text-[9px] font-bold">
                                            {__('Concluida')}
                                        </Badge>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                                            {item.paciente?.tipo_paciente === 'animal' ? '🐾' : '👤'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.paciente?.tipo_paciente === 'animal'
                                                    ? `${item.paciente.nombre_mascota}`
                                                    : `${item.paciente?.nombres} ${item.paciente?.apellidos}`}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Dr(a). {item.medico?.nombres} {item.medico?.apellidos}
                                            </p>
                                        </div>
                                    </div>

                                    {item.diagnostico_cie10_nombre && (
                                        <div className="bg-muted/40 p-2 rounded-xl border text-[11px] space-y-0.5">
                                            <span className="font-bold text-primary block">{__('Diagnóstico CIE-10:')}</span>
                                            <span className="font-medium text-foreground">{item.diagnostico_cie10_nombre}</span>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(`/admin/citas/${item.cita.id}/atencion`)}
                                        className="w-full rounded-xl font-bold border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 h-9 text-xs gap-1.5"
                                    >
                                        <FileText className="size-3.5 text-emerald-600" />
                                        {__('Ver Ficha & Receta')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Previsualización de Pre-Consulta */}
            <Dialog open={!!previewPreconsulta} onOpenChange={() => setPreviewPreconsulta(null)}>
                <DialogContent className="rounded-3xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold text-base">
                            <Sparkles className="size-5 text-emerald-500" />
                            {__('Cuestionario de Pre-Consulta')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {previewPreconsulta?.paciente?.nombres} {previewPreconsulta?.paciente?.apellidos}
                        </DialogDescription>
                    </DialogHeader>

                    {previewPreconsulta?.cita?.preconsulta?.respuestas && (
                        <div className="space-y-2.5 p-3 bg-muted/30 rounded-2xl border text-xs max-h-[350px] overflow-y-auto">
                            {Object.entries(previewPreconsulta.cita.preconsulta.respuestas).map(([preg, resp], idx) => (
                                <div key={idx} className="p-3 bg-background rounded-xl border">
                                    <span className="font-bold text-muted-foreground block text-[11px]">{preg}</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{String(resp)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
