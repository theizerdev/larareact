import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    Calendar,
    Search,
    X,
    MoreVertical,
    Clock,
    User,
    FileText,
    Pill,
    Award,
    Printer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface ConsultaItem {
    id: number;
    estado: string;
    diagnostico_cie10_nombre?: string;
    finalizada_at?: string;
    created_at: string;
    cita: {
        id: number;
        codigo_cita: string;
        fecha_hora_inicio: string;
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
    };
    especialidad?: {
        id: number;
        nombre: string;
    };
    receta?: {
        id: number;
        medicamentos?: any[];
    };
}

interface MedicoCount {
    id: number;
    nombre_completo: string;
    total: number;
}

interface Props {
    consultas: {
        data: ConsultaItem[];
        total: number;
    };
    totalConsultas: number;
    consultasHoy: number;
    consultasPorMedico: MedicoCount[];
    medicos: Array<{ id: number; nombres: string; apellidos: string }>;
    filters: {
        search?: string;
        medico_id?: string;
        fecha?: string;
        per_page?: string;
    };
}

export default function Finalizadas({
    consultas,
    totalConsultas = 0,
    consultasHoy = 0,
    consultasPorMedico = [],
    medicos = [],
    filters = {},
}: Props) {
    const __ = (key: string) => key;

    const [search, setSearch] = useState(filters.search || '');
    const [medicoId, setMedicoId] = useState(filters.medico_id || 'all');
    const [fecha, setFecha] = useState(filters.fecha || '');
    const [perPage, setPerPage] = useState(filters.per_page || '15');

    // Estado del Modal de Constancia de Asistencia
    const [constanciaModalOpen, setConstanciaModalOpen] = useState(false);
    const [selectedConsulta, setSelectedConsulta] = useState<ConsultaItem | null>(null);
    const [motivoConstancia, setMotivoConstancia] = useState('Consulta médica');
    const [incluirAcompanante, setIncluirAcompanante] = useState(false);
    const [nombreAcompanante, setNombreAcompanante] = useState('');
    const [cedulaAcompanante, setCedulaAcompanante] = useState('');
    const [relacionAcompanante, setRelacionAcompanante] = useState('');

    const handleOpenConstanciaModal = (item: ConsultaItem) => {
        setSelectedConsulta(item);
        setMotivoConstancia('Consulta médica');
        setIncluirAcompanante(false);
        setNombreAcompanante('');
        setCedulaAcompanante('');
        setRelacionAcompanante('');
        setConstanciaModalOpen(true);
    };

    const handleGenerarConstancia = () => {
        if (!selectedConsulta) return;
        const params = new URLSearchParams({
            motivo: motivoConstancia || 'Consulta médica',
            incluir_acompanante: incluirAcompanante ? '1' : '0',
            nombre_acompanante: nombreAcompanante,
            cedula_acompanante: cedulaAcompanante,
            relacion_acompanante: relacionAcompanante,
            format: 'pdf',
        });
        window.open(`/admin/consultas/${selectedConsulta.id}/imprimir/constancia?${params.toString()}`, '_blank');
        setConstanciaModalOpen(false);
    };

    const handleFilter = () => {
        router.get(
            '/admin/consultas/finalizadas',
            {
                search: search || undefined,
                medico_id: medicoId !== 'all' ? medicoId : undefined,
                fecha: fecha || undefined,
                per_page: perPage,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setMedicoId('all');
        setFecha('');
        setPerPage('15');
        router.get('/admin/consultas/finalizadas');
    };

    const formatFecha = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="w-full space-y-5 pb-10">

            {/* Header Banner Esmeralda Elegante */}
            <div className="bg-[#059669] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                        <CheckCircle2 className="size-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Consultas Finalizadas</h1>
                        <p className="text-xs text-emerald-100 mt-0.5 font-medium">Historial de atenciones concluidas y recetas emitidas</p>
                    </div>
                </div>

                <Button
                    onClick={() => router.get('/admin/citas')}
                    className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs h-9 px-4 shadow-sm shrink-0 border-0"
                >
                    <Calendar className="size-4 mr-1.5 text-emerald-700" />
                    Ver Calendario
                </Button>
            </div>

            {/* Top 3 Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card rounded-2xl border shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                            TOTAL ATENDIDOS
                        </span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalConsultas}</span>
                    </div>
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="size-5" />
                    </div>
                </div>

                <div className="p-4 bg-card rounded-2xl border shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                            ATENDIDOS HOY
                        </span>
                        <span className="text-2xl font-black text-blue-600 mt-1 block">{consultasHoy}</span>
                    </div>
                    <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        <Calendar className="size-5" />
                    </div>
                </div>

                <div className="p-4 bg-card rounded-2xl border shadow-xs flex flex-col justify-between space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <User className="size-3.5" />
                        Por Médico
                    </span>
                    <div className="space-y-1 max-h-16 overflow-y-auto pr-1">
                        {consultasPorMedico.length === 0 ? (
                            <span className="text-xs text-muted-foreground font-medium">Sin atenciones concluidas</span>
                        ) : (
                            consultasPorMedico.map((med) => (
                                <div key={med.id} className="flex items-center justify-between text-xs font-semibold">
                                    <span className="truncate text-foreground max-w-[200px]">{med.nombre_completo}</span>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 font-mono text-[10px] px-1.5 py-0">
                                        {med.total}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Bar Row */}
            <div className="p-4 bg-card rounded-2xl border shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground block">Búsqueda</label>
                        <Input
                            type="text"
                            placeholder="Paciente, médico, código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            className="h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground block">Médico</label>
                        <Select value={medicoId} onValueChange={(val) => setMedicoId(val)}>
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue placeholder="Todos los médicos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los médicos</SelectItem>
                                {medicos.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        Dr(a). {m.nombres} {m.apellidos}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground block">Fecha</label>
                        <Input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="h-9 text-xs rounded-xl"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground block">Por página</label>
                        <Select value={perPage} onValueChange={(val) => setPerPage(val)}>
                            <SelectTrigger className="w-full h-9 text-xs rounded-xl">
                                <SelectValue placeholder="15" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" onClick={handleFilter} className="h-9 text-xs rounded-xl font-bold flex-1 bg-emerald-600 hover:bg-emerald-700">
                            Filtrar
                        </Button>
                        <Button type="button" variant="outline" onClick={handleReset} className="h-9 text-xs rounded-xl font-bold">
                            Limpiar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card rounded-2xl border shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 border-b text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                            <tr>
                                <th className="p-4">CÓDIGO</th>
                                <th className="p-4">PACIENTE</th>
                                <th className="p-4">MÉDICO</th>
                                <th className="p-4">ESPECIALIDAD</th>
                                <th className="p-4">DIAGNÓSTICO CIE-10</th>
                                <th className="p-4">FECHA ATENCIÓN</th>
                                <th className="p-4">ESTADO</th>
                                <th className="p-4 text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-border/40 font-medium">
                            {consultas.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                                        No hay consultas finalizadas registradas.
                                    </td>
                                </tr>
                            ) : (
                                consultas.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-4 font-mono font-extrabold text-emerald-600">
                                            #{item.cita.codigo_cita}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-foreground block">
                                                {item.paciente?.tipo_paciente === 'animal'
                                                    ? `${item.paciente.nombre_mascota}`
                                                    : `${item.paciente?.nombres} ${item.paciente?.apellidos}`}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {item.paciente?.codigo_paciente}
                                            </span>
                                        </td>
                                        <td className="p-4 text-foreground font-semibold">
                                            Dr(a). {item.medico?.nombres} {item.medico?.apellidos}
                                        </td>
                                        <td className="p-4 text-muted-foreground font-medium">
                                            {item.especialidad?.nombre || 'General'}
                                        </td>
                                        <td className="p-4 font-semibold text-foreground">
                                            {item.diagnostico_cie10_nombre || '-'}
                                        </td>
                                        <td className="p-4 text-muted-foreground font-medium">
                                            {formatFecha(item.finalizada_at || item.created_at)}
                                        </td>
                                        <td className="p-4">
                                            <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md shadow-2xs">
                                                Finalizada
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 text-xs font-bold rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 gap-1.5"
                                                    >
                                                        <FileText className="size-3.5 text-emerald-600" />
                                                        Imprimir Documentos
                                                        <MoreVertical className="size-3.5 ml-1 opacity-70" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg">
                                                    <DropdownMenuItem
                                                        onClick={() => window.open(`/admin/consultas/${item.id}/imprimir/informe`, '_blank')}
                                                        className="rounded-xl cursor-pointer text-xs font-bold gap-2 py-2"
                                                    >
                                                        <FileText className="size-4 text-primary" />
                                                        📄 Informe Médico Completo
                                                    </DropdownMenuItem>
                                                    {item.receta && item.receta.medicamentos && item.receta.medicamentos.length > 0 && (
                                                        <DropdownMenuItem
                                                            onClick={() => window.open(`/admin/consultas/${item.id}/imprimir/receta`, '_blank')}
                                                            className="rounded-xl cursor-pointer text-xs font-bold gap-2 py-2"
                                                        >
                                                            <Pill className="size-4 text-emerald-600" />
                                                            💊 Receta Médica (RP)
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(item.orden_estudio || item.ordenEstudio)?.estudios?.length > 0 && (
                                                        <DropdownMenuItem
                                                            onClick={() => window.open(`/admin/consultas/${item.id}/imprimir/estudios`, '_blank')}
                                                            className="rounded-xl cursor-pointer text-xs font-bold gap-2 py-2"
                                                        >
                                                            <CheckCircle2 className="size-4 text-blue-600" />
                                                            🔬 Orden de Estudios
                                                        </DropdownMenuItem>
                                                    )}
                                                    {item.reposo && (item.reposo.tiene_reposo ?? true) && (
                                                        <DropdownMenuItem
                                                            onClick={() => window.open(`/admin/consultas/${item.id}/imprimir/reposo`, '_blank')}
                                                            className="rounded-xl cursor-pointer text-xs font-bold gap-2 py-2"
                                                        >
                                                            <Calendar className="size-4 text-amber-600" />
                                                            📜 Certificado de Reposo
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleOpenConstanciaModal(item)}
                                                        className="rounded-xl cursor-pointer text-xs font-bold gap-2 py-2 border-t border-dashed mt-1 pt-2"
                                                    >
                                                        <Award className="size-4 text-amber-500" />
                                                        🎖️ Constancia de Asistencia
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
            </div>

            {/* MODAL DIALOG PARA GENERAR CONSTANCIA DE ASISTENCIA */}
            <Dialog open={constanciaModalOpen} onOpenChange={setConstanciaModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 shadow-2xl border-0">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-800">
                            <Award className="size-5 text-amber-500" />
                            Constancia de Asistencia
                        </DialogTitle>
                        {selectedConsulta && (
                            <p className="text-xs text-muted-foreground font-semibold">
                                Paciente: <strong className="text-slate-800">{selectedConsulta.paciente.nombres} {selectedConsulta.paciente.apellidos}</strong>
                            </p>
                        )}
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {/* Motivo de la Consulta */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-extrabold text-slate-700">
                                Motivo de la consulta (para la constancia)
                            </Label>
                            <Input
                                value={motivoConstancia}
                                onChange={(e) => setMotivoConstancia(e.target.value)}
                                placeholder="Consulta médica"
                                className="h-10 text-xs font-semibold rounded-xl border-slate-200"
                            />
                        </div>

                        {/* Toggle Acompañante */}
                        <div className="flex items-center space-x-3 py-1">
                            <Switch
                                id="modal_incluir_acompanante"
                                checked={incluirAcompanante}
                                onCheckedChange={setIncluirAcompanante}
                            />
                            <Label htmlFor="modal_incluir_acompanante" className="text-xs font-bold text-slate-700 cursor-pointer">
                                Incluir acompañante
                            </Label>
                        </div>

                        {/* Formulario Acompañante */}
                        {incluirAcompanante && (
                            <div className="bg-slate-100/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">
                                        Nombre completo del acompañante
                                    </Label>
                                    <Input
                                        value={nombreAcompanante}
                                        onChange={(e) => setNombreAcompanante(e.target.value)}
                                        placeholder="Nombre y apellido"
                                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">
                                        Cédula / Documento
                                    </Label>
                                    <Input
                                        value={cedulaAcompanante}
                                        onChange={(e) => setCedulaAcompanante(e.target.value)}
                                        placeholder="Ej: 12345678"
                                        className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-slate-600">
                                        Relación con el paciente
                                    </Label>
                                    <Select value={relacionAcompanante} onValueChange={setRelacionAcompanante}>
                                        <SelectTrigger className="h-9 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 w-full">
                                            <SelectValue placeholder="-- Seleccionar --" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Familiar" className="text-xs">Familiar</SelectItem>
                                            <SelectItem value="Cónyuge" className="text-xs">Cónyuge</SelectItem>
                                            <SelectItem value="Madre" className="text-xs">Madre</SelectItem>
                                            <SelectItem value="Padre" className="text-xs">Padre</SelectItem>
                                            <SelectItem value="Hijo(a)" className="text-xs">Hijo(a)</SelectItem>
                                            <SelectItem value="Amigo(a)" className="text-xs">Amigo(a)</SelectItem>
                                            <SelectItem value="Tutor(a)" className="text-xs">Tutor(a)</SelectItem>
                                            <SelectItem value="Otro" className="text-xs">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConstanciaModalOpen(false)}
                            className="rounded-xl text-xs font-bold h-10 px-5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleGenerarConstancia}
                            className="rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white gap-2 h-10 px-5 shadow-md shadow-amber-500/20"
                        >
                            <Printer className="size-4" />
                            Generar Constancia
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
