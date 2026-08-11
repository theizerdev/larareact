import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { 
    Clock, 
    ShieldCheck, 
    Calendar, 
    Plus, 
    Pencil, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Sparkles, 
    Save, 
    Building2,
    CalendarCheck,
    Briefcase,
    BadgeCheck,
    Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notifySuccess } from '@/utils/notifications';

interface ConfiguracionAsistencia {
    id: number;
    empresa_id: number | null;
    tolerancia_retardo_minutos: number;
    tolerancia_falta_minutos: number;
    descanso_es_tiempo_efectivo: boolean;
    horas_extra_requieren_aprobacion: boolean;
    porcentaje_prima_dominical: string;
    requiere_foto_marcaje: boolean;
    redondeo_marcaje_minutos: number;
}

interface TurnoLaboral {
    id: number;
    nombre: string;
    tipo_jornada: 'diurna' | 'nocturna' | 'mixta' | 'personalizada';
    hora_entrada: string;
    hora_salida: string;
    horas_diarias_ley: string;
    minutos_descanso: number;
    descanso_pagado: boolean;
    dias_laborables: number[];
    status: boolean;
}

interface DiaFestivo {
    id: number;
    fecha: string;
    descripcion: string;
    es_oficial_lft: boolean;
    pago_porcentaje: string;
}

interface Props {
    configuracion: ConfiguracionAsistencia;
    turnos: TurnoLaboral[];
    diasFestivos: DiaFestivo[];
}

const DIAS_SEMANA = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 7, label: 'Domingo' },
];

export default function ConfiguracionAsistenciaIndex({ configuracion, turnos, diasFestivos }: Props) {
    const [activeTab, setActiveTab] = useState('politicas');

    // Formulario de Configuración General
    const configForm = useForm({
        tolerancia_retardo_minutos: configuracion?.tolerancia_retardo_minutos ?? 10,
        tolerancia_falta_minutos: configuracion?.tolerancia_falta_minutos ?? 30,
        descanso_es_tiempo_efectivo: configuracion?.descanso_es_tiempo_efectivo ?? false,
        horas_extra_requieren_aprobacion: configuracion?.horas_extra_requieren_aprobacion ?? true,
        porcentaje_prima_dominical: configuracion?.porcentaje_prima_dominical ?? '25.00',
        requiere_foto_marcaje: configuracion?.requiere_foto_marcaje ?? false,
        redondeo_marcaje_minutos: configuracion?.redondeo_marcaje_minutos ?? 0,
    });

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        configForm.put('/asistencia/configuracion', {
            preserveScroll: true,
            onSuccess: () => notifySuccess('Configuración de asistencia guardada correctamente.'),
        });
    };

    // Modal de Turnos
    const [isTurnoModalOpen, setIsTurnoModalOpen] = useState(false);
    const [editingTurno, setEditingTurno] = useState<TurnoLaboral | null>(null);

    const turnoForm = useForm({
        nombre: '',
        tipo_jornada: 'diurna',
        hora_entrada: '08:00',
        hora_salida: '16:00',
        horas_diarias_ley: '8.00',
        minutos_descanso: 30,
        descanso_pagado: false,
        dias_laborables: [1, 2, 3, 4, 5],
    });

    const openTurnoCreate = () => {
        setEditingTurno(null);
        turnoForm.setData({
            nombre: '',
            tipo_jornada: 'diurna',
            hora_entrada: '08:00',
            hora_salida: '16:00',
            horas_diarias_ley: '8.00',
            minutos_descanso: 30,
            descanso_pagado: false,
            dias_laborables: [1, 2, 3, 4, 5],
        });
        setIsTurnoModalOpen(true);
    };

    const openTurnoEdit = (turno: TurnoLaboral) => {
        setEditingTurno(turno);
        turnoForm.setData({
            nombre: turno.nombre,
            tipo_jornada: turno.tipo_jornada,
            hora_entrada: turno.hora_entrada.substring(0, 5),
            hora_salida: turno.hora_salida.substring(0, 5),
            horas_diarias_ley: turno.horas_diarias_ley,
            minutos_descanso: turno.minutos_descanso,
            descanso_pagado: turno.descanso_pagado,
            dias_laborables: turno.dias_laborables ?? [1, 2, 3, 4, 5],
        });
        setIsTurnoModalOpen(true);
    };

    const handleTipoJornadaChange = (tipo: 'diurna' | 'nocturna' | 'mixta' | 'personalizada') => {
        let horas = '8.00';
        if (tipo === 'nocturna') horas = '7.00';
        if (tipo === 'mixta') horas = '7.50';

        turnoForm.setData({
            ...turnoForm.data,
            tipo_jornada: tipo,
            horas_diarias_ley: horas,
        });
    };

    const handleSaveTurno = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTurno) {
            turnoForm.put(`/asistencia/turnos/${editingTurno.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTurnoModalOpen(false);
                    notifySuccess('Turno laboral actualizado.');
                },
            });
        } else {
            turnoForm.post('/asistencia/turnos', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTurnoModalOpen(false);
                    notifySuccess('Turno laboral creado.');
                },
            });
        }
    };

    const handleToggleTurno = (turno: TurnoLaboral) => {
        router.patch(`/asistencia/turnos/${turno.id}/toggle`, {}, { preserveScroll: true });
    };

    const [deletingTurno, setDeletingTurno] = useState<TurnoLaboral | null>(null);

    const handleDeleteTurno = () => {
        if (!deletingTurno) return;
        router.delete(`/asistencia/turnos/${deletingTurno.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingTurno(null),
        });
    };

    // Modal de Días Festivos
    const [isFestivoModalOpen, setIsFestivoModalOpen] = useState(false);
    const [editingFestivo, setEditingFestivo] = useState<DiaFestivo | null>(null);

    const festivoForm = useForm({
        fecha: '',
        descripcion: '',
        es_oficial_lft: true,
        pago_porcentaje: '200.00',
    });

    const openFestivoCreate = () => {
        setEditingFestivo(null);
        festivoForm.setData({
            fecha: '',
            descripcion: '',
            es_oficial_lft: true,
            pago_porcentaje: '200.00',
        });
        setIsFestivoModalOpen(true);
    };

    const openFestivoEdit = (festivo: DiaFestivo) => {
        setEditingFestivo(festivo);
        festivoForm.setData({
            fecha: festivo.fecha.substring(0, 10),
            descripcion: festivo.descripcion,
            es_oficial_lft: festivo.es_oficial_lft,
            pago_porcentaje: festivo.pago_porcentaje,
        });
        setIsFestivoModalOpen(true);
    };

    const handleSaveFestivo = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFestivo) {
            festivoForm.put(`/asistencia/festivos/${editingFestivo.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFestivoModalOpen(false);
                    notifySuccess('Día festivo actualizado.');
                },
            });
        } else {
            festivoForm.post('/asistencia/festivos', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFestivoModalOpen(false);
                    notifySuccess('Día festivo guardado.');
                },
            });
        }
    };

    const [deletingFestivo, setDeletingFestivo] = useState<DiaFestivo | null>(null);

    const handleDeleteFestivo = () => {
        if (!deletingFestivo) return;
        router.delete(`/asistencia/festivos/${deletingFestivo.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingFestivo(null),
        });
    };

    const handlePrecargarLft = () => {
        router.post('/asistencia/festivos/precargar-lft', {}, { preserveScroll: true });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Configuración de Asistencia y LFT', href: '/asistencia/configuracion' },
    ];

    return (
        <>
            <Head title="Configuración de Asistencia LFT" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ModuleHeader Estándar del Sistema */}
                <ModuleHeader
                    icon={<Clock className="h-6 w-6 text-white" />}
                    title="Configuración de Asistencia & LFT"
                    description="Políticas de tolerancia, catálogo de turnos por jornada (Diurna, Nocturna, Mixta), descansos (Art. 64) y días festivos."
                    colorClassName="bg-slate-900 dark:bg-slate-800"
                />

                {/* Contenido en Pestañas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-3 w-full max-w-2xl">
                        <TabsTrigger value="politicas" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Políticas de Asistencia</span>
                        </TabsTrigger>
                        <TabsTrigger value="turnos" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span>Turnos y Jornadas ({turnos.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="festivos" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Días Festivos LFT ({diasFestivos.length})</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* PESTAÑA 1: POLÍTICAS DE ASISTENCIA Y REGLAS LFT */}
                    <TabsContent value="politicas">
                        <form onSubmit={handleSaveConfig} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            Tolerancias y Marcaje
                                        </CardTitle>
                                        <CardDescription>
                                            Límites de tiempo para considerar asistencias a tiempo o retardo.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Tolerancia para Retardo (Minutos)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="120"
                                                value={configForm.data.tolerancia_retardo_minutos}
                                                onChange={(e) => configForm.setData('tolerancia_retardo_minutos', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-muted-foreground">Minutos posteriores a la hora de entrada permitidos sin sancionar.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Tolerancia Máxima antes de Falta (Minutos)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="240"
                                                value={configForm.data.tolerancia_falta_minutos}
                                                onChange={(e) => configForm.setData('tolerancia_falta_minutos', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-muted-foreground">Pasado este tiempo, el sistema marcará Falta injustificada.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Redondeo de Hora de Marcaje</Label>
                                            <Select
                                                value={configForm.data.redondeo_marcaje_minutos.toString()}
                                                onValueChange={(val) => configForm.setData('redondeo_marcaje_minutos', parseInt(val))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar redondeo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Sin redondeo (Hora exacta del servidor)</SelectItem>
                                                    <SelectItem value="5">Redondear a los 5 minutos más cercanos</SelectItem>
                                                    <SelectItem value="10">Redondear a los 10 minutos más cercanos</SelectItem>
                                                    <SelectItem value="15">Redondear a los 15 minutos (Cuarto de hora)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label>Requiere Foto de Evidencia</Label>
                                                <p className="text-xs text-muted-foreground">Captura la fotografía del empleado en el Kiosko Checador.</p>
                                            </div>
                                            <Switch
                                                checked={configForm.data.requiere_foto_marcaje}
                                                onCheckedChange={(checked) => configForm.setData('requiere_foto_marcaje', checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            Reglas LFT & Horas Extras
                                        </CardTitle>
                                        <CardDescription>
                                            Cálculo legal de descansos, horas extra dobles/triples y primas.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Art. 64 LFT Switch */}
                                        <div className="p-4 rounded-xl border space-y-3 bg-muted/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <Label className="font-semibold">Descanso es Tiempo Efectivo (Art. 64 LFT)</Label>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.descanso_es_tiempo_efectivo}
                                                    onCheckedChange={(checked) => configForm.setData('descanso_es_tiempo_efectivo', checked)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {configForm.data.descanso_es_tiempo_efectivo ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Si el trabajador no puede salir del lugar de trabajo durante el descanso, este se computará como tiempo efectivo de jornada laboral.</span>
                                                ) : (
                                                    <span>Los 30 minutos de descanso son libres fuera del centro de trabajo y no se computan dentro de las horas laboradas.</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Aprobación Horas Extra */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label>Aprobación Previa de Horas Extras</Label>
                                                <p className="text-xs text-muted-foreground">Requiere validación de supervisor antes de transferir excedentes a nómina.</p>
                                            </div>
                                            <Switch
                                                checked={configForm.data.horas_extra_requieren_aprobacion}
                                                onCheckedChange={(checked) => configForm.setData('horas_extra_requieren_aprobacion', checked)}
                                            />
                                        </div>

                                        {/* Prima Dominical */}
                                        <div className="space-y-2 pt-2 border-t">
                                            <Label>Porcentaje Prima Dominical (% Art. 71 LFT)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="25"
                                                    max="100"
                                                    value={configForm.data.porcentaje_prima_dominical}
                                                    onChange={(e) => configForm.setData('porcentaje_prima_dominical', e.target.value)}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Por ley es mínimo el 25% sobre el salario diario ordinario.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={configForm.processing} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    <span>Guardar Configuración General</span>
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* PESTAÑA 2: TURNOS Y JORNADAS LABORALES */}
                    <TabsContent value="turnos" className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                            <div>
                                <h3 className="text-base font-semibold">Catálogo de Turnos Laborales</h3>
                                <p className="text-muted-foreground text-xs">Clasificación de jornadas en Diurna (max 8h), Nocturna (max 7h) y Mixta (max 7.5h) según Art. 60 y 61 LFT.</p>
                            </div>
                            <Button onClick={openTurnoCreate} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Nuevo Turno</span>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {turnos.map((t) => (
                                <Card key={t.id} className={`relative transition-all duration-200 ${!t.status ? 'opacity-60' : ''}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base font-bold">{t.nombre}</CardTitle>
                                                <Badge className={`mt-1 text-xs capitalize ${
                                                    t.tipo_jornada === 'diurna' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    t.tipo_jornada === 'nocturna' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}>
                                                    Jornada {t.tipo_jornada} ({t.horas_diarias_ley}h)
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openTurnoEdit(t)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => setDeletingTurno(t)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-xs">
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="text-muted-foreground">Horario Entrada / Salida:</span>
                                            <span className="font-semibold">{t.hora_entrada.substring(0, 5)} - {t.hora_salida.substring(0, 5)} hrs</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="text-muted-foreground">Tiempo de Descanso:</span>
                                            <span className="font-semibold">{t.minutos_descanso} min ({t.descanso_pagado ? 'Pagado' : 'No pagado'})</span>
                                        </div>
                                        <div className="pt-1">
                                            <span className="text-muted-foreground block mb-1">Días Laborables:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {DIAS_SEMANA.map((d) => {
                                                    const isLab = t.dias_laborables?.includes(d.id);
                                                    return (
                                                        <span key={d.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                            isLab ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {d.label.substring(0, 3)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between items-center border-t">
                                            <span className="text-muted-foreground">Estado:</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleTurno(t)}
                                                className={t.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}
                                            >
                                                {t.status ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                                {t.status ? 'Activo' : 'Inactivo'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* PESTAÑA 3: DÍAS FESTIVOS Y DESCANSOS OBLIGATORIOS */}
                    <TabsContent value="festivos" className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card">
                            <div>
                                <h3 className="text-base font-semibold">Días Festivos Obligatorios (Art. 74 LFT)</h3>
                                <p className="text-muted-foreground text-xs">Los días festivos trabajados se pagan al 200% adicional (Pago Triple total).</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handlePrecargarLft} variant="outline" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Precargar Festivos LFT</span>
                                </Button>
                                <Button onClick={openFestivoCreate} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Agregar Festivo</span>
                                </Button>
                            </div>
                        </div>
                                </Button>
                            </div>
                        </div>

                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Descripción</th>
                                            <th className="px-4 py-3">Origen</th>
                                            <th className="px-4 py-3">Pago Adicional</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {diasFestivos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    No hay días festivos registrados. Haz clic en "Precargar Festivos LFT" para cargar los oficiales de Ley.
                                                </td>
                                            </tr>
                                        ) : (
                                            diasFestivos.map((f) => (
                                                <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3 font-semibold">
                                                        {f.fecha.substring(0, 10)}
                                                    </td>
                                                    <td className="px-4 py-3">{f.descripcion}</td>
                                                    <td className="px-4 py-3">
                                                        {f.es_oficial_lft ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px]">
                                                                Oficial Ley (Art. 74)
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[11px]">
                                                                Corporativo / Especial
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                                                        +{f.pago_porcentaje}% (Pago Triple)
                                                    </td>
                                                    <td className="px-4 py-3 text-right space-x-2">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openFestivoEdit(f)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => setDeletingFestivo(f)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODAL CREAR / EDITAR TURNO */}
            <Dialog open={isTurnoModalOpen} onOpenChange={setIsTurnoModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingTurno ? 'Editar Turno Laboral' : 'Nuevo Turno Laboral'}</DialogTitle>
                        <DialogDescription>
                            Configure las horas y límites legales según la Ley Federal del Trabajo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveTurno} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Nombre del Turno</Label>
                            <Input
                                required
                                value={turnoForm.data.nombre}
                                onChange={(e) => turnoForm.setData('nombre', e.target.value)}
                                placeholder="Ej. Turno Matutino Planta 1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Jornada LFT</Label>
                                <Select
                                    value={turnoForm.data.tipo_jornada}
                                    onValueChange={(val: any) => handleTipoJornadaChange(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="diurna">Diurna (Máx 8.0h)</SelectItem>
                                        <SelectItem value="nocturna">Nocturna (Máx 7.0h)</SelectItem>
                                        <SelectItem value="mixta">Mixta (Máx 7.5h)</SelectItem>
                                        <SelectItem value="personalizada">Personalizada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Horas Diarias Ley</Label>
                                <Input
                                    type="number"
                                    step="0.25"
                                    value={turnoForm.data.horas_diarias_ley}
                                    onChange={(e) => turnoForm.setData('horas_diarias_ley', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hora Entrada</Label>
                                <Input
                                    type="time"
                                    required
                                    value={turnoForm.data.hora_entrada}
                                    onChange={(e) => turnoForm.setData('hora_entrada', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hora Salida</Label>
                                <Input
                                    type="time"
                                    required
                                    value={turnoForm.data.hora_salida}
                                    onChange={(e) => turnoForm.setData('hora_salida', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Descanso (Minutos)</Label>
                                <Input
                                    type="number"
                                    value={turnoForm.data.minutos_descanso}
                                    onChange={(e) => turnoForm.setData('minutos_descanso', parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="flex flex-col justify-end space-y-2">
                                <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                    <Label className="text-xs">Descanso Pagado</Label>
                                    <Switch
                                        checked={turnoForm.data.descanso_pagado}
                                        onCheckedChange={(checked) => turnoForm.setData('descanso_pagado', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="block mb-1">Días Laborables de la Semana</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {DIAS_SEMANA.map((d) => {
                                    const selected = turnoForm.data.dias_laborables.includes(d.id);
                                    return (
                                        <button
                                            type="button"
                                            key={d.id}
                                            onClick={() => {
                                                const current = [...turnoForm.data.dias_laborables];
                                                const next = selected ? current.filter((id) => id !== d.id) : [...current, d.id];
                                                turnoForm.setData('dias_laborables', next);
                                            }}
                                            className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all ${
                                                selected
                                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsTurnoModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={turnoForm.processing}>
                                {editingTurno ? 'Guardar Cambios' : 'Crear Turno'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL CREAR / EDITAR FESTIVO */}
            <Dialog open={isFestivoModalOpen} onOpenChange={setIsFestivoModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingFestivo ? 'Editar Día Festivo' : 'Nuevo Día Festivo'}</DialogTitle>
                        <DialogDescription>
                            Establezca la fecha y el porcentaje de remuneración adicional.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveFestivo} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Fecha del Festivo</Label>
                            <Input
                                type="date"
                                required
                                value={festivoForm.data.fecha}
                                onChange={(e) => festivoForm.setData('fecha', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción / Motivo</Label>
                            <Input
                                required
                                value={festivoForm.data.descripcion}
                                onChange={(e) => festivoForm.setData('descripcion', e.target.value)}
                                placeholder="Ej. Día del Trabajador Agrícola"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Pago Adicional (% Remuneración)</Label>
                            <Input
                                type="number"
                                step="10"
                                required
                                value={festivoForm.data.pago_porcentaje}
                                onChange={(e) => festivoForm.setData('pago_porcentaje', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">200.00% por Ley (Salario diario + 200% = Pago Triple).</p>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <Label className="text-xs">Es Festivo Oficial (Art. 74 LFT)</Label>
                            <Switch
                                checked={festivoForm.data.es_oficial_lft}
                                onCheckedChange={(checked) => festivoForm.setData('es_oficial_lft', checked)}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsFestivoModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={festivoForm.processing}>
                                Guardar Festivo
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ALERTA ELIMINAR TURNO */}
            <AlertDialog open={!!deletingTurno} onOpenChange={() => setDeletingTurno(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Turno Laboral?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el turno "{deletingTurno?.nombre}". Los empleados asignados perderán la vinculación a este turno.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTurno} className="bg-rose-600 hover:bg-rose-700 text-white">
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ALERTA ELIMINAR FESTIVO */}
            <AlertDialog open={!!deletingFestivo} onOpenChange={() => setDeletingFestivo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Día Festivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará la fecha {deletingFestivo?.fecha} ({deletingFestivo?.descripcion}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFestivo} className="bg-rose-600 hover:bg-rose-700 text-white">
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
