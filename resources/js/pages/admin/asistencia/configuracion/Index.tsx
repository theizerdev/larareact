import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
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
    Coffee,
    Scale,
    AlertTriangle,
    Bell,
    Mail,
    ShieldAlert,
    Check,
    Sliders,
    TrendingDown,
    Activity
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
import { useTranslate } from '@/hooks/use-translate';

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
    ley_silla_intervalo_horas?: string | number;
    ley_silla_descanso_minutos?: number;
    whatsapp_recordatorio_descanso?: boolean;
    whatsapp_recordatorio_horas_post_entrada?: string | number;
    // Reforma Laboral 48h -> 40h
    reforma_laboral_ano?: number;
    limite_horas_normales_semanal?: string | number;
    limite_tex_doble_semanal?: string | number;
    limite_tex_triple_semanal?: string | number;
    // Semáforo Normal
    semaforo_normal_verde?: string | number;
    semaforo_normal_amarillo?: string | number;
    semaforo_normal_rojo?: string | number;
    // Semáforo TEX Doble
    semaforo_tex_doble_verde?: string | number;
    semaforo_tex_doble_amarillo?: string | number;
    semaforo_tex_doble_rojo?: string | number;
    // Semáforo TEX Triple
    semaforo_tex_triple_verde?: string | number;
    semaforo_tex_triple_amarillo?: string | number;
    semaforo_tex_triple_rojo?: string | number;
    // Notificaciones Escalonadas
    notif_rh_email?: string | null;
    notif_rh_enabled?: boolean;
    notif_responsable_enabled?: boolean;
    notif_dg_email?: string | null;
    notif_dg_enabled?: boolean;
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
    cronogramaReforma?: Record<number, { normales: number; tex_doble: number; tex_triple: number; total: number }>;
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

const DIA_MAP: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miércoles: 3,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sábado: 6,
    sabado: 6,
    domingo: 7,
};

function normalizeDiasLaborables(dias: any[]): number[] {
    if (!Array.isArray(dias)) return [1, 2, 3, 4, 5];
    const res = dias.map((d) => {
        if (typeof d === 'number') return d;
        if (typeof d === 'string') {
            const num = parseInt(d, 10);
            if (!isNaN(num) && num >= 1 && num <= 7) return num;
            const key = d.trim().toLowerCase();
            return DIA_MAP[key] ?? null;
        }
        return null;
    }).filter((v): v is number => v !== null && v >= 1 && v <= 7);
    return res.length > 0 ? res : [1, 2, 3, 4, 5];
}

const CRONOGRAMA_OFICIAL: Record<number, { normales: number; tex_doble: number; tex_triple: number; total: number }> = {
    2026: { normales: 48, tex_doble: 12, tex_triple: 4, total: 64 },
    2027: { normales: 46, tex_doble: 9,  tex_triple: 4, total: 59 },
    2028: { normales: 44, tex_doble: 9,  tex_triple: 4, total: 57 },
    2029: { normales: 42, tex_doble: 9,  tex_triple: 4, total: 55 },
    2030: { normales: 40, tex_doble: 9,  tex_triple: 4, total: 53 },
};

export default function ConfiguracionAsistenciaIndex({ configuracion, turnos, diasFestivos }: Props) {
    const { __, currentLocale, isRtl } = useTranslate();
    const [activeTab, setActiveTab] = useState('politicas');

    // Formulario de Configuración General y Reforma Laboral
    const configForm = useForm({
        tolerancia_retardo_minutos: configuracion?.tolerancia_retardo_minutos ?? 10,
        tolerancia_falta_minutos: configuracion?.tolerancia_falta_minutos ?? 30,
        descanso_es_tiempo_efectivo: configuracion?.descanso_es_tiempo_efectivo ?? false,
        horas_extra_requieren_aprobacion: configuracion?.horas_extra_requieren_aprobacion ?? true,
        porcentaje_prima_dominical: configuracion?.porcentaje_prima_dominical ?? '25.00',
        requiere_foto_marcaje: configuracion?.requiere_foto_marcaje ?? false,
        redondeo_marcaje_minutos: configuracion?.redondeo_marcaje_minutos ?? 0,
        ley_silla_intervalo_horas: configuracion?.ley_silla_intervalo_horas ?? '2.00',
        ley_silla_descanso_minutos: configuracion?.ley_silla_descanso_minutos ?? 5,
        whatsapp_recordatorio_descanso: configuracion?.whatsapp_recordatorio_descanso ?? true,
        whatsapp_recordatorio_horas_post_entrada: configuracion?.whatsapp_recordatorio_horas_post_entrada ?? '4.00',
        // Reforma Laboral 48h -> 40h
        reforma_laboral_ano: configuracion?.reforma_laboral_ano ?? 2026,
        limite_horas_normales_semanal: configuracion?.limite_horas_normales_semanal ?? 48,
        limite_tex_doble_semanal: configuracion?.limite_tex_doble_semanal ?? 12,
        limite_tex_triple_semanal: configuracion?.limite_tex_triple_semanal ?? 4,
        // Semáforo Normal
        semaforo_normal_verde: configuracion?.semaforo_normal_verde ?? 42,
        semaforo_normal_amarillo: configuracion?.semaforo_normal_amarillo ?? 44,
        semaforo_normal_rojo: configuracion?.semaforo_normal_rojo ?? 46,
        // Semáforo TEX Doble
        semaforo_tex_doble_verde: configuracion?.semaforo_tex_doble_verde ?? 7,
        semaforo_tex_doble_amarillo: configuracion?.semaforo_tex_doble_amarillo ?? 8,
        semaforo_tex_doble_rojo: configuracion?.semaforo_tex_doble_rojo ?? 9,
        // Semáforo TEX Triple
        semaforo_tex_triple_verde: configuracion?.semaforo_tex_triple_verde ?? 2,
        semaforo_tex_triple_amarillo: configuracion?.semaforo_tex_triple_amarillo ?? 3,
        semaforo_tex_triple_rojo: configuracion?.semaforo_tex_triple_rojo ?? 4,
        // Notificaciones Escalonadas
        notif_rh_email: configuracion?.notif_rh_email ?? '',
        notif_rh_enabled: configuracion?.notif_rh_enabled ?? true,
        notif_responsable_enabled: configuracion?.notif_responsable_enabled ?? true,
        notif_dg_email: configuracion?.notif_dg_email ?? '',
        notif_dg_enabled: configuracion?.notif_dg_enabled ?? true,
    });

    const handleSelectRegimenAno = (ano: number) => {
        const info = CRONOGRAMA_OFICIAL[ano];
        if (info) {
            configForm.setData({
                ...configForm.data,
                reforma_laboral_ano: ano,
                limite_horas_normales_semanal: info.normales,
                limite_tex_doble_semanal: info.tex_doble,
                limite_tex_triple_semanal: info.tex_triple,
            });
        }
    };

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        configForm.put('/admin/asistencia/configuracion', {
            preserveScroll: true,
            onSuccess: () => notifySuccess(__('Configuración guardada correctamente.')),
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
            dias_laborables: normalizeDiasLaborables(turno.dias_laborables),
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
            turnoForm.put(`/admin/asistencia/turnos/${editingTurno.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTurnoModalOpen(false);
                    notifySuccess(__('Turno laboral actualizado.'));
                },
            });
        } else {
            turnoForm.post('/admin/asistencia/turnos', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTurnoModalOpen(false);
                    notifySuccess(__('Turno laboral creado.'));
                },
            });
        }
    };

    const handleToggleTurno = (turno: TurnoLaboral) => {
        router.patch(`/admin/asistencia/turnos/${turno.id}/toggle`, {}, { preserveScroll: true });
    };

    const [deletingTurno, setDeletingTurno] = useState<TurnoLaboral | null>(null);

    const handleDeleteTurno = () => {
        if (!deletingTurno) return;
        router.delete(`/admin/asistencia/turnos/${deletingTurno.id}`, {
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
            festivoForm.put(`/admin/asistencia/festivos/${editingFestivo.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFestivoModalOpen(false);
                    notifySuccess(__('Día festivo actualizado.'));
                },
            });
        } else {
            festivoForm.post('/admin/asistencia/festivos', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFestivoModalOpen(false);
                    notifySuccess(__('Día festivo guardado.'));
                },
            });
        }
    };

    const [deletingFestivo, setDeletingFestivo] = useState<DiaFestivo | null>(null);

    const handleDeleteFestivo = () => {
        if (!deletingFestivo) return;
        router.delete(`/admin/asistencia/festivos/${deletingFestivo.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingFestivo(null),
        });
    };

    const handlePrecargarLft = () => {
        router.post('/admin/asistencia/festivos/precargar-lft', {}, { preserveScroll: true });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/dashboard' },
        { title: __('Configuración de Asistencia'), href: '/admin/asistencia/configuracion' },
    ];

    return (
        <>
            <Head title={__('Configuración de Asistencia')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ModuleHeader Estándar del Sistema */}
                <ModuleHeader
                    icon={<Clock className="h-6 w-6 text-white" />}
                    title={__('Configuración de Asistencia & Turnos')}
                    description={__('Políticas de tolerancia, catálogo de turnos por jornada (Diurna, Nocturna, Mixta), descansos y días festivos.')}
                    colorClassName="bg-slate-900 dark:bg-slate-800"
                />

                {/* Contenido en Pestañas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full max-w-3xl">
                        <TabsTrigger value="politicas" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{__('Políticas de Asistencia')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="reforma" className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{__('Reforma 40h & Semáforos')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="turnos" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            <span>{__('Turnos y Jornadas')} (<span dir="ltr">{turnos.length}</span>)</span>
                        </TabsTrigger>
                        <TabsTrigger value="festivos" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{__('Días Festivos')} (<span dir="ltr">{diasFestivos.length}</span>)</span>
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
                                            <span>{__('Tolerancias y Marcaje')}</span>
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Límites de tiempo para considerar asistencias a tiempo o retardo.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{__('Tolerancia para Retardo (Minutos)')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="120"
                                                value={configForm.data.tolerancia_retardo_minutos}
                                                onChange={(e) => configForm.setData('tolerancia_retardo_minutos', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-muted-foreground">{__('Minutos posteriores a la hora de entrada permitidos sin sancionar.')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{__('Tolerancia Máxima antes de Falta (Minutos)')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="240"
                                                value={configForm.data.tolerancia_falta_minutos}
                                                onChange={(e) => configForm.setData('tolerancia_falta_minutos', parseInt(e.target.value) || 0)}
                                            />
                                            <p className="text-xs text-muted-foreground">{__('Pasado este tiempo, el sistema marcará Falta injustificada.')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{__('Redondeo de Hora de Marcaje')}</Label>
                                            <Select
                                                value={configForm.data.redondeo_marcaje_minutos.toString()}
                                                onValueChange={(val) => configForm.setData('redondeo_marcaje_minutos', parseInt(val))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={__('Seleccionar redondeo')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">{__('Sin redondeo (Hora exacta del servidor)')}</SelectItem>
                                                    <SelectItem value="5">{__('Redondear a los 5 minutos más cercanos')}</SelectItem>
                                                    <SelectItem value="10">{__('Redondear a los 10 minutos más cercanos')}</SelectItem>
                                                    <SelectItem value="15">{__('Redondear a los 15 minutos (Cuarto de hora)')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label>{__('Requiere Foto de Evidencia')}</Label>
                                                <p className="text-xs text-muted-foreground">{__('Captura la fotografía del empleado en el Kiosko Checador.')}</p>
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
                                            <span>{__('Reglas de Horas Extras')}</span>
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Cálculo de descansos, horas extra dobles/triples y primas.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Descanso Switch */}
                                        <div className="p-4 rounded-xl border space-y-3 bg-muted/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <Label className="font-semibold">{__('Descanso es Tiempo Efectivo')}</Label>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.descanso_es_tiempo_efectivo}
                                                    onCheckedChange={(checked) => configForm.setData('descanso_es_tiempo_efectivo', checked)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {configForm.data.descanso_es_tiempo_efectivo ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{__('✓ Si el trabajador no puede salir del lugar de trabajo durante el descanso, este se computará como tiempo efectivo de jornada laboral.')}</span>
                                                ) : (
                                                    <span>{__('Los 30 minutos de descanso son libres fuera del centro de trabajo y no se computan dentro de las horas laboradas.')}</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Aprobación Horas Extra */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label>{__('Aprobación Previa de Horas Extras')}</Label>
                                                <p className="text-xs text-muted-foreground">{__('Requiere validación de supervisor antes de transferir excedentes a nómina.')}</p>
                                            </div>
                                            <Switch
                                                checked={configForm.data.horas_extra_requieren_aprobacion}
                                                onCheckedChange={(checked) => configForm.setData('horas_extra_requieren_aprobacion', checked)}
                                            />
                                        </div>

                                        {/* Prima Dominical */}
                                        <div className="space-y-2 pt-2 border-t">
                                            <Label>{__('Porcentaje Prima Dominical (%)')}</Label>
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
                                                <span className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-muted-foreground text-sm">%</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{__('Por ley es mínimo el 25% sobre el salario diario ordinario.')}</p>
                                        </div>

                                        {/* Ley Silla & Descansos */}
                                        <div className="p-4 rounded-xl border space-y-4 bg-muted/20 border-emerald-500/30">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                <Coffee className="w-4 h-4" />
                                                <span>{__('Regla Ley Silla & Recordatorios de Descanso')}</span>
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">{__('Intervalo de Trabajo (Horas)')}</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        min="1"
                                                        max="10"
                                                        value={configForm.data.ley_silla_intervalo_horas}
                                                        onChange={(e) => configForm.setData('ley_silla_intervalo_horas', e.target.value)}
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">{__('Horas continuas de labor.')}</p>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">{__('Minutos Descanso Sentado')}</Label>
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="1"
                                                        max="60"
                                                        value={configForm.data.ley_silla_descanso_minutos}
                                                        onChange={(e) => configForm.setData('ley_silla_descanso_minutos', parseInt(e.target.value) || 5)}
                                                    />
                                                    <p className="text-[11px] text-muted-foreground">{__('Tiempo asignado por intervalo.')}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-xs font-semibold">{__('Recordatorio de Descanso por WhatsApp')}</Label>
                                                        <p className="text-[11px] text-muted-foreground">{__('Notifica al empleado en su marcaje de entrada cuándo tomar su descanso.')}</p>
                                                    </div>
                                                    <Switch
                                                        checked={configForm.data.whatsapp_recordatorio_descanso}
                                                        onCheckedChange={(checked) => configForm.setData('whatsapp_recordatorio_descanso', checked)}
                                                    />
                                                </div>

                                                {configForm.data.whatsapp_recordatorio_descanso && (
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs">{__('Recordar a las (Horas post-entrada):')}</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.5"
                                                            min="1"
                                                            max="8"
                                                            value={configForm.data.whatsapp_recordatorio_horas_post_entrada}
                                                            onChange={(e) => configForm.setData('whatsapp_recordatorio_horas_post_entrada', e.target.value)}
                                                        />
                                                        <p className="text-[11px] text-muted-foreground">{__('Ejemplo: 4.0 hrs (A las 4 horas de iniciada la jornada laboral).')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={configForm.processing} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    <span>{__('Guardar Configuración General')}</span>
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* PESTAÑA: REFORMA LABORAL 48H A 40H & SEMÁFOROS ESCALONADOS LFT */}
                    <TabsContent value="reforma">
                        <form onSubmit={handleSaveConfig} className="space-y-6">
                            {/* Card 1: Cronograma Oficial de Reducción Gradual */}
                            <Card className="border-emerald-500/30 dark:border-emerald-500/20 shadow-sm overflow-hidden">
                                <CardHeader className="bg-emerald-500/5 dark:bg-emerald-950/20 border-b border-emerald-500/20">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <Scale className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                                    <span>{__('Cronograma de Reducción Gradual de Jornada (LFT)')}</span>
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                                                        <span dir="ltr">2</span> {__('hrs / año')}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>
                                                    {__('Transición escalonada de 48h a 40h semanales. Selecciona el año en curso para sincronizar los límites laborales.')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{__('Régimen Activo:')}</span>
                                            <Badge className="bg-emerald-600 text-white font-bold px-3 py-1 text-sm">
                                                {__('Año')} <span dir="ltr">{configForm.data.reforma_laboral_ano}</span> (<span dir="ltr">{configForm.data.limite_horas_normales_semanal}</span>h {__('Normales')})
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {/* Tabla Interactiva de Transición */}
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                                    <th className="py-3 px-4 text-left rtl:text-right">{__('Semana / Concepto')}</th>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => {
                                                        const isActive = configForm.data.reforma_laboral_ano === ano;
                                                        return (
                                                            <th key={ano} className={`py-3 px-4 text-center transition-colors ${isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black' : ''}`}>
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span>{ano}</span>
                                                                    {isActive && (
                                                                        <Badge className="bg-emerald-600 text-[10px] text-white px-1.5 py-0 h-4">
                                                                            {__('Vigente')}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                        <span>{__('Horas Normales Semanales')}</span>
                                                    </td>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => (
                                                        <td key={ano} className={`py-3 px-4 text-center font-semibold ${configForm.data.reforma_laboral_ano === ano ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold' : ''}`}>
                                                            <span dir="ltr">{CRONOGRAMA_OFICIAL[ano].normales}</span> {__('hrs')}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <TrendingDown className="w-4 h-4 text-amber-500" />
                                                        <span>{__('TEX Doble (Horas Extra 2x)')}</span>
                                                    </td>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => (
                                                        <td key={ano} className={`py-3 px-4 text-center font-semibold ${configForm.data.reforma_laboral_ano === ano ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold' : ''}`}>
                                                            <span dir="ltr">{CRONOGRAMA_OFICIAL[ano].tex_doble}</span> {__('hrs')}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                        <span>{__('TEX Triple (Horas Extra 3x)')}</span>
                                                    </td>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => (
                                                        <td key={ano} className={`py-3 px-4 text-center font-semibold ${configForm.data.reforma_laboral_ano === ano ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold' : ''}`}>
                                                            <span dir="ltr">{CRONOGRAMA_OFICIAL[ano].tex_triple}</span> {__('hrs')}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-bold">
                                                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span>{__('Total Horas Máximas')}</span>
                                                    </td>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => (
                                                        <td key={ano} className={`py-3 px-4 text-center font-black ${configForm.data.reforma_laboral_ano === ano ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            <span dir="ltr">{CRONOGRAMA_OFICIAL[ano].total}</span> {__('hrs')}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr>
                                                    <td className="py-3 px-4 text-xs text-muted-foreground font-medium text-left rtl:text-right">
                                                        {__('Selección Rápida')}
                                                    </td>
                                                    {[2026, 2027, 2028, 2029, 2030].map((ano) => {
                                                        const isCurrent = configForm.data.reforma_laboral_ano === ano;
                                                        return (
                                                            <td key={ano} className="py-2.5 px-3 text-center">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant={isCurrent ? "default" : "outline"}
                                                                    onClick={() => handleSelectRegimenAno(ano)}
                                                                    className={`w-full text-xs h-7 gap-1 ${isCurrent ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'border-slate-300 dark:border-slate-700'}`}
                                                                >
                                                                    {isCurrent ? (
                                                                        <>
                                                                            <Check className="w-3 h-3" />
                                                                            <span>{__('Activo')}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>{__('Aplicar')} <span dir="ltr">{ano}</span></span>
                                                                    )}
                                                                </Button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Ajuste manual fino de límites si se desea */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Límite Horas Normales (Semana)')}</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="30"
                                                max="60"
                                                value={configForm.data.limite_horas_normales_semanal}
                                                onChange={(e) => configForm.setData('limite_horas_normales_semanal', e.target.value)}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{__('Horas ordinarias legales para el régimen seleccionado.')}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Límite Horas Extras Dobles (Semana)')}</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="30"
                                                value={configForm.data.limite_tex_doble_semanal}
                                                onChange={(e) => configForm.setData('limite_tex_doble_semanal', e.target.value)}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{__('Horas pagadas al 200% (12h en 2026, 9h a partir de 2027).')}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">{__('Límite Horas Extras Triples (Semana)')}</Label>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="20"
                                                value={configForm.data.limite_tex_triple_semanal}
                                                onChange={(e) => configForm.setData('limite_tex_triple_semanal', e.target.value)}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{__('Límite máximo permitido de horas triples al 300% (4 hrs).')}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Matriz de Semáforos LFT y Notificaciones Escalonadas */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Subcard A: Semáforo Normal */}
                                <Card className="border-blue-500/30 dark:border-blue-500/20 shadow-sm flex flex-col justify-between">
                                    <CardHeader className="bg-blue-500/5 dark:bg-blue-950/20 border-b border-blue-500/20 pb-4">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span>{__('Semáforo Normal')}</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Monitoreo de horas ordinarias acumuladas con alertas escalonadas.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4 flex-1">
                                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                                    {__('🟢 Nivel Verde')}
                                                </span>
                                                <Badge className="bg-emerald-600 text-white text-[10px]">{__('Notif: RH')}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_normal_verde}
                                                        onChange={(e) => configForm.setData('semaforo_normal_verde', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                                    {__('🟡 Nivel Amarillo')}
                                                </span>
                                                <Badge className="bg-amber-600 text-white text-[10px]">{__('Notif: Responsable')}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_normal_amarillo}
                                                        onChange={(e) => configForm.setData('semaforo_normal_amarillo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                                    {__('🔴 Nivel Rojo')}
                                                </span>
                                                <Badge className="bg-rose-600 text-white text-[10px]">{__('Notif: DG')}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_normal_rojo}
                                                        onChange={(e) => configForm.setData('semaforo_normal_rojo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Subcard B: Semáforo TEX Doble */}
                                <Card className="border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col justify-between">
                                    <CardHeader className="bg-amber-500/5 dark:bg-amber-950/20 border-b border-amber-500/20 pb-4">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            <span>{__('Semáforo TEX Doble')}</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Horas extras al 200% acumuladas en la semana.')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4 flex-1">
                                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                    {__('🟢 Nivel Verde')}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">{__('Preventivo')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_doble_verde}
                                                        onChange={(e) => configForm.setData('semaforo_tex_doble_verde', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                    {__('🟡 Nivel Amarillo')}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">{__('Atención')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_doble_amarillo}
                                                        onChange={(e) => configForm.setData('semaforo_tex_doble_amarillo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                                    {__('🔴 Nivel Rojo')}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-bold">{__('Límite Máximo')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_doble_rojo}
                                                        onChange={(e) => configForm.setData('semaforo_tex_doble_rojo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Subcard C: Semáforo TEX Triple */}
                                <Card className="border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col justify-between">
                                    <CardHeader className="bg-rose-500/5 dark:bg-rose-950/20 border-b border-rose-500/20 pb-4">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                            <span>{__('Semáforo TEX Triple')}</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {__('Horas extras al 300% (excedentes de horas dobles).')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4 flex-1">
                                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                    {__('🟢 Nivel Verde')}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">{__('Alerta Inicial')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_triple_verde}
                                                        onChange={(e) => configForm.setData('semaforo_tex_triple_verde', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                    {__('🟡 Nivel Amarillo')}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-semibold">{__('Alerta Crítica')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_triple_amarillo}
                                                        onChange={(e) => configForm.setData('semaforo_tex_triple_amarillo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                                    {__('🔴 Nivel Rojo')}
                                                </span>
                                                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{__('Máximo LFT')}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground">{__('Umbral de Horas')}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        value={configForm.data.semaforo_tex_triple_rojo}
                                                        onChange={(e) => configForm.setData('semaforo_tex_triple_rojo', e.target.value)}
                                                        className="h-8 text-xs font-bold font-mono"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-semibold">{__('hrs')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Card 3: Canales de Notificaciones Escalonadas */}
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/40 border-b pb-4">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>{__('Destinatarios y Canales de Notificaciones Escalonadas')}</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {__('Configura hacia quién se dirigen los avisos al cruzar los umbrales de jornada laboral.')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* RH */}
                                        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-emerald-600 text-white font-bold">{__('🟢 RH (42h)')}</Badge>
                                                    <span className="text-xs font-semibold">{__('Recursos Humanos')}</span>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.notif_rh_enabled}
                                                    onCheckedChange={(checked) => configForm.setData('notif_rh_enabled', checked)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">{__('Correo Electrónico de RH')}</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="rh@empresa.com"
                                                    value={configForm.data.notif_rh_email || ''}
                                                    onChange={(e) => configForm.setData('notif_rh_email', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{__('Aviso preventivo cuando un colaborador alcanza 42h ordinarias semanales.')}</p>
                                        </div>

                                        {/* Responsable */}
                                        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-amber-600 text-white font-bold">{__('🟡 Responsable (44h)')}</Badge>
                                                    <span className="text-xs font-semibold">{__('Supervisor / Sede')}</span>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.notif_responsable_enabled}
                                                    onCheckedChange={(checked) => configForm.setData('notif_responsable_enabled', checked)}
                                                />
                                            </div>
                                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200">
                                                <p className="font-semibold">{__('Responsable directo asignado')}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{__('Se notifica automáticamente al supervisor directo de sede que tenga registrado el colaborador.')}</p>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{__('Aviso de atención cuando un colaborador alcanza 44h ordinarias semanales.')}</p>
                                        </div>

                                        {/* {__('Dirección General')} */}
                                        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-rose-600 text-white font-bold">{__('🔴 DG (46h)')}</Badge>
                                                    <span className="text-xs font-semibold">{__('Dirección General')}</span>
                                                </div>
                                                <Switch
                                                    checked={configForm.data.notif_dg_enabled}
                                                    onCheckedChange={(checked) => configForm.setData('notif_dg_enabled', checked)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">{__('Correo Dirección General')}</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="direccion@empresa.com"
                                                    value={configForm.data.notif_dg_email || ''}
                                                    onChange={(e) => configForm.setData('notif_dg_email', e.target.value)}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{__('Alerta crítica a la alta dirección al alcanzar 46h ordinarias semanales.')}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={configForm.processing} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                                    <Save className="w-4 h-4" />
                                    <span>{__('Guardar Parámetros de Reforma Laboral & Semáforos')}</span>
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* PESTAÑA 2: TURNOS Y JORNADAS LABORALES */}
                    <TabsContent value="turnos" className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                            <div>
                                <h3 className="text-base font-semibold">{__('Catálogo de Turnos Laborales')}</h3>
                                <p className="text-muted-foreground text-xs">{__('Clasificación de jornadas en Diurna (max 8h), Nocturna (max 7h) y Mixta (max 7.5h) según el tipo de jornada.')}</p>
                            </div>
                            <Button onClick={openTurnoCreate} className="gap-2">
                                <Plus className="w-4 h-4" />
                                <span>{__('Nuevo Turno')}</span>
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
                                                    {__('Jornada')} {t.tipo_jornada === 'diurna' ? __('Diurna') : t.tipo_jornada === 'nocturna' ? __('Nocturna') : t.tipo_jornada === 'mixta' ? __('Mixta') : t.tipo_jornada} (<span dir="ltr">{t.horas_diarias_ley}</span>h)
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
                                            <span className="text-muted-foreground">{__('Horario Entrada / Salida:')}</span>
                                            <span className="font-semibold"><span dir="ltr">{t.hora_entrada.substring(0, 5)} - {t.hora_salida.substring(0, 5)}</span> {__('hrs')}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b">
                                            <span className="text-muted-foreground">{__('Tiempo de Descanso:')}</span>
                                            <span className="font-semibold"><span dir="ltr">{t.minutos_descanso}</span> {__('min')} ({t.descanso_pagado ? __('Pagado') : __('No pagado')})</span>
                                        </div>
                                        <div className="pt-1">
                                            <span className="text-muted-foreground block mb-1">{__('Días Laborables:')}</span>
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    const norm = normalizeDiasLaborables(t.dias_laborables);
                                                    return DIAS_SEMANA.map((d) => {
                                                        const isLab = norm.includes(d.id);
                                                        return (
                                                            <span key={d.id} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                                isLab ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                {__(d.label).substring(0, 3)}
                                                            </span>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-between items-center border-t">
                                            <span className="text-muted-foreground">{__('Estado:')}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleTurno(t)}
                                                className={t.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}
                                            >
                                                {t.status ? <CheckCircle2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> : <XCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />}
                                                {t.status ? __('Activo') : __('Inactivo')}
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
                                <h3 className="text-base font-semibold">{__('Días Festivos Obligatorios')}</h3>
                                <p className="text-muted-foreground text-xs">{__('Los días festivos trabajados se pagan al 200% adicional (Pago Triple total).')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handlePrecargarLft} variant="outline" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{__('Precargar Festivos Oficiales')}</span>
                                </Button>
                                <Button onClick={openFestivoCreate} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span>{__('Agregar Festivo')}</span>
                                </Button>
                            </div>
                        </div>

                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left rtl:text-right">{__('Fecha')}</th>
                                            <th className="px-4 py-3 text-left rtl:text-right">{__('Descripción')}</th>
                                            <th className="px-4 py-3 text-left rtl:text-right">{__('Origen')}</th>
                                            <th className="px-4 py-3 text-left rtl:text-right">{__('Pago Adicional')}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left">{__('Acciones')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {diasFestivos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    {__('No hay días festivos registrados. Haz clic en "Precargar Festivos Oficiales" para cargar los oficiales de Ley.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            diasFestivos.map((f) => (
                                                <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3 font-semibold">
                                                        <span dir="ltr">{f.fecha.substring(0, 10)}</span>
                                                    </td>
                                                    <td className="px-4 py-3">{f.descripcion}</td>
                                                    <td className="px-4 py-3">
                                                        {f.es_oficial_lft ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px]">
                                                                {__('Oficial Ley')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[11px]">
                                                                {__('Corporativo / Especial')}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                                                        <span dir="ltr">+{f.pago_porcentaje}%</span> ({__('Pago Triple')})
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
                        <DialogTitle>{editingTurno ? __('Editar Turno Laboral') : __('Nuevo Turno Laboral')}</DialogTitle>
                        <DialogDescription>
                            {__('Configure las horas y límites legales según la Ley Federal del Trabajo.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveTurno} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>{__('Nombre del Turno')}</Label>
                            <Input
                                required
                                value={turnoForm.data.nombre}
                                onChange={(e) => turnoForm.setData('nombre', e.target.value)}
                                placeholder={__('Ej. Turno Matutino Planta 1')}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{__('Tipo de Jornada')}</Label>
                                <Select
                                    value={turnoForm.data.tipo_jornada}
                                    onValueChange={(val: any) => handleTipoJornadaChange(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="diurna">{__('Diurna (Máx 8.0h)')}</SelectItem>
                                        <SelectItem value="nocturna">{__('Nocturna (Máx 7.0h)')}</SelectItem>
                                        <SelectItem value="mixta">{__('Mixta (Máx 7.5h)')}</SelectItem>
                                        <SelectItem value="personalizada">{__('Personalizada')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Horas Diarias Ley')}</Label>
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
                                <Label>{__('Hora Entrada')}</Label>
                                <Input
                                    type="time"
                                    required
                                    value={turnoForm.data.hora_entrada}
                                    onChange={(e) => turnoForm.setData('hora_entrada', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Hora Salida')}</Label>
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
                                <Label>{__('Descanso (Minutos)')}</Label>
                                <Input
                                    type="number"
                                    value={turnoForm.data.minutos_descanso}
                                    onChange={(e) => turnoForm.setData('minutos_descanso', parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div className="flex flex-col justify-end space-y-2">
                                <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                    <Label className="text-xs">{__('Descanso Pagado')}</Label>
                                    <Switch
                                        checked={turnoForm.data.descanso_pagado}
                                        onCheckedChange={(checked) => turnoForm.setData('descanso_pagado', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="block mb-1">{__('Días Laborables de la Semana')}</Label>
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
                                            {__(d.label)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsTurnoModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={turnoForm.processing}>
                                {editingTurno ? __('Guardar Cambios') : __('Crear Turno')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL CREAR / EDITAR FESTIVO */}
            <Dialog open={isFestivoModalOpen} onOpenChange={setIsFestivoModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingFestivo ? __('Editar Día Festivo') : __('Nuevo Día Festivo')}</DialogTitle>
                        <DialogDescription>
                            {__('Establezca la fecha y el porcentaje de remuneración adicional.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveFestivo} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>{__('Fecha del Festivo')}</Label>
                            <Input
                                type="date"
                                required
                                value={festivoForm.data.fecha}
                                onChange={(e) => festivoForm.setData('fecha', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{__('Descripción / Motivo')}</Label>
                            <Input
                                required
                                value={festivoForm.data.descripcion}
                                onChange={(e) => festivoForm.setData('descripcion', e.target.value)}
                                placeholder={__('Ej. Día del Trabajador Agrícola')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{__('Pago Adicional (% Remuneración)')}</Label>
                            <Input
                                type="number"
                                step="10"
                                required
                                value={festivoForm.data.pago_porcentaje}
                                onChange={(e) => festivoForm.setData('pago_porcentaje', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{__('200.00% por Ley (Salario diario + 200% = Pago Triple).')}</p>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <Label className="text-xs">{__('Es Festivo Oficial de Ley')}</Label>
                            <Switch
                                checked={festivoForm.data.es_oficial_lft}
                                onCheckedChange={(checked) => festivoForm.setData('es_oficial_lft', checked)}
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsFestivoModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={festivoForm.processing}>
                                {__('Guardar Festivo')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ALERTA ELIMINAR TURNO */}
            <AlertDialog open={!!deletingTurno} onOpenChange={() => setDeletingTurno(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('¿Eliminar Turno Laboral?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Esta acción eliminará el turno ":nombre". Los empleados asignados perderán la vinculación a este turno.', { nombre: deletingTurno?.nombre ?? '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancelar')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTurno} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {__('Confirmar Eliminación')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ALERTA ELIMINAR FESTIVO */}
            <AlertDialog open={!!deletingFestivo} onOpenChange={() => setDeletingFestivo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('¿Eliminar Día Festivo?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Se eliminará la fecha :fecha (:descripcion).', { fecha: deletingFestivo?.fecha ?? '', descripcion: deletingFestivo?.descripcion ?? '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancelar')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFestivo} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {__('Confirmar Eliminación')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
