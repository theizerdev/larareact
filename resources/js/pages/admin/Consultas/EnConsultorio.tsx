import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Stethoscope,
    Calendar,
    Search,
    X,
    MoreVertical,
    Clock,
    User,
    Play,
    Sparkles,
    FileText,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConsultaItem {
    id: number;
    estado: string;
    motivo_consulta?: string;
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

export default function EnConsultorio({
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

    const handleFilter = () => {
        router.get(
            '/admin/consultas/en-consultorio',
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
        router.get('/admin/consultas/en-consultorio');
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

            {/* Header Banner Púrpura Elegante */}
            <div className="bg-[#7c3aed] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                        <Stethoscope className="size-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">En Consultorio</h1>
                        <p className="text-xs text-purple-100 mt-0.5 font-medium">Gestión de consultas en atención activa</p>
                    </div>
                </div>

                <Button
                    onClick={() => router.get('/admin/citas')}
                    className="bg-white hover:bg-purple-50 text-purple-800 font-bold rounded-xl text-xs h-9 px-4 shadow-sm shrink-0 border-0"
                >
                    <Calendar className="size-4 mr-1.5 text-purple-700" />
                    Ver Calendario
                </Button>
            </div>

            {/* Top 3 Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card rounded-2xl border shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                            TOTAL ATENCIONES
                        </span>
                        <span className="text-2xl font-black text-purple-600 mt-1 block">{totalConsultas}</span>
                    </div>
                    <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                        <Stethoscope className="size-5" />
                    </div>
                </div>

                <div className="p-4 bg-card rounded-2xl border shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                            ATENCIONES HOY
                        </span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{consultasHoy}</span>
                    </div>
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
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
                            <span className="text-xs text-muted-foreground font-medium">Sin consultas asignadas</span>
                        ) : (
                            consultasPorMedico.map((med) => (
                                <div key={med.id} className="flex items-center justify-between text-xs font-semibold">
                                    <span className="truncate text-foreground max-w-[200px]">{med.nombre_completo}</span>
                                    <Badge className="bg-purple-500/10 text-purple-600 font-mono text-[10px] px-1.5 py-0">
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
                        <Button type="button" onClick={handleFilter} className="h-9 text-xs rounded-xl font-bold flex-1 bg-purple-600 hover:bg-purple-700">
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
                                <th className="p-4">FECHA INICIO</th>
                                <th className="p-4">ESTADO</th>
                                <th className="p-4 text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-border/40 font-medium">
                            {consultas.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                        No hay atenciones activas en consultorio.
                                    </td>
                                </tr>
                            ) : (
                                consultas.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-4 font-mono font-extrabold text-purple-600">
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
                                        <td className="p-4 text-muted-foreground font-medium">
                                            {formatFecha(item.created_at)}
                                        </td>
                                        <td className="p-4">
                                            <Badge className="bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md animate-pulse shadow-2xs">
                                                En Consultorio
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                onClick={() => router.get(`/admin/consultas/${item.cita.id}/atencion`)}
                                                className="h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                                            >

                                                <Stethoscope className="size-3.5" />
                                                Continuar Wizard
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
