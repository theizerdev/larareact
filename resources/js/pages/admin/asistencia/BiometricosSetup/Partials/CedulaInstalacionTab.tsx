import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    ImageIcon,
    Loader2,
    Lock,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Upload,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { notifyError, notifySuccess } from '@/utils/notifications';

interface ActividadItem {
    id: number;
    catalogo_id: number;
    numero_actividad: number;
    descripcion: string;
    tipo: 'Inicial' | 'Nuevo';
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'no_aplica';
    responsable: string | null;
    valida: string | null;
    fecha_compromiso: string | null;
    fecha_realizada: string | null;
    entregable_evidencia: string;
    evidencia_path: string | null;
    evidencia_tipo: string | null;
    observaciones: string | null;
    validado_por?: { id: number; name: string } | null;
    validado_at?: string | null;
}

interface SubEtapa {
    sub_etapa_letra: string;
    sub_etapa_nombre: string;
    total: number;
    completadas: number;
    porcentaje: number;
    is_completed: boolean;
    is_locked: boolean;
    actividades: ActividadItem[];
}

interface Etapa {
    etapa_num: number;
    etapa_nombre: string;
    total: number;
    completadas: number;
    porcentaje: number;
    is_completed: boolean;
    is_locked: boolean;
    sub_etapas: SubEtapa[];
}

interface CedulaTree {
    cedula_id: number;
    reloj_equipo_biometrico_id: number;
    porcentaje_avance: number;
    total_actividades: number;
    actividades_completadas: number;
    estado: 'pendiente' | 'en_proceso' | 'completada';
    etapa_actual_num: number;
    sub_etapa_actual_letra: string;
    etapas: Etapa[];
}

interface CedulaInstalacionTabProps {
    biometricoId: number;
    biometricoNombre?: string;
    canManage?: boolean;
    onViewFullPhoto?: (url: string, title: string) => void;
}

export default function CedulaInstalacionTab({
    biometricoId,
    biometricoNombre,
    canManage = true,
    onViewFullPhoto,
}: CedulaInstalacionTabProps) {
    const [cedula, setCedula] = useState<CedulaTree | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeEtapaTab, setActiveEtapaTab] = useState<string>('etapa_1');
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

    const fetchCedula = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/admin/asistencia/biometricos-setup/${biometricoId}/cedula`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            if (json.success && json.cedula) {
                setCedula(json.cedula);
                // Si la etapa actual está definida, seleccionarla
                if (json.cedula.etapa_actual_num) {
                    setActiveEtapaTab(`etapa_${json.cedula.etapa_actual_num}`);
                }
            } else {
                notifyError(json.message || 'No se pudo cargar la cédula de instalación.');
            }
        } catch {
            notifyError('Error de red al consultar la cédula de instalación.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (biometricoId) {
            fetchCedula();
        }
    }, [biometricoId]);

    const handleUpdateItem = async (itemId: number, patchData: Partial<ActividadItem>) => {
        setUpdatingItemId(itemId);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/admin/asistencia/biometricos-setup/${biometricoId}/cedula/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify(patchData),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                notifyError(json.message || 'No se pudo actualizar la actividad.');
                return;
            }

            notifySuccess(json.message || 'Actividad actualizada.');
            if (json.cedula) {
                setCedula(json.cedula);
            }
        } catch {
            notifyError('Ocurrió un error al actualizar la actividad.');
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleUploadEvidencia = async (itemId: number, file: File) => {
        setUploadingItemId(itemId);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/admin/asistencia/biometricos-setup/${biometricoId}/cedula/items/${itemId}/evidencia`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: formData,
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                notifyError(json.message || 'Error al subir la evidencia.');
                return;
            }

            notifySuccess(json.message || 'Evidencia subida exitosamente.');
            if (json.cedula) {
                setCedula(json.cedula);
            }
        } catch {
            notifyError('Error de red al subir la evidencia.');
        } finally {
            setUploadingItemId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">
                    Cargando Cédula de Instalación y evaluando dependencias...
                </p>
            </div>
        );
    }

    if (!cedula) {
        return (
            <div className="p-8 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-sm font-semibold">No se encontró información de la Cédula</p>
                <Button type="button" size="sm" onClick={fetchCedula}>
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Cabecera de Progreso General */}
            <div className="rounded-xl border bg-gradient-to-r from-indigo-50/50 via-slate-50/50 to-emerald-50/40 dark:from-indigo-950/20 dark:via-slate-900/30 dark:to-emerald-950/20 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Cédula de Instalación Oficial
                            </h3>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-[11px] font-semibold',
                                    cedula.estado === 'completada'
                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : cedula.estado === 'en_proceso'
                                            ? 'border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                )}
                            >
                                {cedula.estado === 'completada'
                                    ? 'Cédula Completada'
                                    : cedula.estado === 'en_proceso'
                                        ? 'En Proceso'
                                        : 'Pendiente de Inicio'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Flujo secuencial de 3 etapas dependientes y 48 actividades de validación.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                            <span className="text-xl font-bold font-mono text-primary">
                                {cedula.porcentaje_avance}%
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                                {cedula.actividades_completadas} de {cedula.total_actividades} cumplidas
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={fetchCedula}
                            title="Recargar cédula"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <Progress value={cedula.porcentaje_avance} className="h-2" />
            </div>

            {/* Tabs de las 3 Etapas */}
            <Tabs value={activeEtapaTab} onValueChange={setActiveEtapaTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1 gap-1.5 bg-muted/60">
                    {cedula.etapas.map((etapa) => {
                        const tabKey = `etapa_${etapa.etapa_num}`;
                        return (
                            <TabsTrigger
                                key={tabKey}
                                value={tabKey}
                                disabled={etapa.is_locked}
                                className={cn(
                                    'py-2.5 px-3 flex items-center justify-between gap-2 text-xs font-semibold rounded-lg transition-all',
                                    etapa.is_locked
                                        ? 'opacity-50 cursor-not-allowed bg-transparent'
                                        : 'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {etapa.is_locked ? (
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    ) : etapa.is_completed ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {etapa.etapa_num}. {etapa.etapa_nombre.replace(/^\d+\s*-\s*/, '')}
                                    </span>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px] shrink-0 font-mono px-1.5 py-0 h-4',
                                        etapa.is_completed
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                            : 'border-slate-300 text-muted-foreground'
                                    )}
                                >
                                    {etapa.completadas}/{etapa.total}
                                </Badge>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {/* Contenido de cada Etapa con Accordion de Sub-Etapas */}
                {cedula.etapas.map((etapa) => {
                    const tabKey = `etapa_${etapa.etapa_num}`;
                    const defaultOpenSub = etapa.sub_etapas
                        .filter((s) => !s.is_locked && !s.is_completed)
                        .map((s) => s.sub_etapa_letra);

                    return (
                        <TabsContent key={tabKey} value={tabKey} className="space-y-4 pt-3">
                            <Accordion
                                type="multiple"
                                defaultValue={
                                    defaultOpenSub.length > 0
                                        ? defaultOpenSub
                                        : etapa.sub_etapas.map((s) => s.sub_etapa_letra)
                                }
                                className="space-y-3"
                            >
                                {etapa.sub_etapas.map((sub) => (
                                    <AccordionItem
                                        key={sub.sub_etapa_letra}
                                        value={sub.sub_etapa_letra}
                                        className={cn(
                                            'rounded-xl border overflow-hidden transition',
                                            sub.is_locked
                                                ? 'border-border/60 bg-muted/20 opacity-75'
                                                : sub.is_completed
                                                    ? 'border-emerald-500/30 bg-card'
                                                    : 'border-border bg-card'
                                        )}
                                    >
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-3 gap-2 text-left">
                                                <div className="flex items-center gap-2.5">
                                                    {sub.is_locked ? (
                                                        <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                                            <Lock className="h-3.5 w-3.5" />
                                                        </div>
                                                    ) : sub.is_completed ? (
                                                        <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-6 w-6 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <Clock className="h-3.5 w-3.5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            Sub-Etapa {sub.sub_etapa_letra}: {sub.sub_etapa_nombre.replace(/^[A-Z]\s*-\s*/, '')}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {sub.completadas} de {sub.total} actividades completadas ({sub.porcentaje}%)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {sub.is_locked ? (
                                                        <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                            <Lock className="h-3 w-3 mr-1" /> Bloqueada
                                                        </Badge>
                                                    ) : sub.is_completed ? (
                                                        <Badge className="bg-emerald-600 text-white text-[10px]">
                                                            ✓ Completada
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300">
                                                            En Progreso
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="p-0">
                                            {sub.is_locked ? (
                                                <div className="p-4 m-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                                                    <Lock className="h-4 w-4 shrink-0" />
                                                    <span>
                                                        Esta sub-etapa se encuentra bloqueada por regla de dependencia. Es necesario completar y validar el 100% de las actividades de las sub-etapas previas para poder desbloquearla.
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/60">
                                                    {sub.actividades.map((act) => {
                                                        const isItemUpdating = updatingItemId === act.id;
                                                        const isItemUploading = uploadingItemId === act.id;

                                                        return (
                                                            <div
                                                                key={act.id}
                                                                className={cn(
                                                                    'p-4 transition space-y-3',
                                                                    act.estado === 'completada'
                                                                        ? 'bg-emerald-50/15 dark:bg-emerald-950/10'
                                                                        : 'hover:bg-muted/20'
                                                                )}
                                                            >
                                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <span className="h-6 w-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                                                                            {act.numero_actividad}
                                                                        </span>
                                                                        <div className="space-y-1">
                                                                            <p className="text-xs font-semibold text-foreground">
                                                                                {act.descripcion}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <Badge variant="outline" className="text-[10px]">
                                                                                    {act.tipo}
                                                                                </Badge>
                                                                                {act.entregable_evidencia && (
                                                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                                        <FileText className="h-3 w-3" />
                                                                                        Entregable: {act.entregable_evidencia}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Selector de Estado */}
                                                                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                                                        {isItemUpdating && (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                                        )}
                                                                        <Select
                                                                            value={act.estado}
                                                                            disabled={!canManage || isItemUpdating}
                                                                            onValueChange={(val: any) =>
                                                                                handleUpdateItem(act.id, { estado: val })
                                                                            }
                                                                        >
                                                                            <SelectTrigger
                                                                                className={cn(
                                                                                    'h-8 w-36 text-xs font-semibold',
                                                                                    act.estado === 'completada'
                                                                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                                        : act.estado === 'en_proceso'
                                                                                            ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                                                            : act.estado === 'no_aplica'
                                                                                                ? 'border-slate-300 text-slate-500'
                                                                                                : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                                                )}
                                                                            >
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                                                                <SelectItem value="en_proceso">En Proceso</SelectItem>
                                                                                <SelectItem value="completada">Completada</SelectItem>
                                                                                <SelectItem value="no_aplica">No Aplica</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                {/* Metadatos y Evidencia */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-lg border">
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">Responsable:</span>{' '}
                                                                        {act.responsable || '—'}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">Validador:</span>{' '}
                                                                        {act.valida || '—'}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">Fecha:</span>{' '}
                                                                        {act.fecha_realizada || act.fecha_compromiso || '—'}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-semibold text-foreground">Evidencia:</span>
                                                                        {act.evidencia_path ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    onViewFullPhoto
                                                                                        ? onViewFullPhoto(act.evidencia_path!, act.descripcion)
                                                                                        : window.open(act.evidencia_path!, '_blank')
                                                                                }
                                                                                className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                                                                            >
                                                                                {act.evidencia_tipo === 'foto' ? (
                                                                                    <ImageIcon className="h-3 w-3" />
                                                                                ) : (
                                                                                    <FileText className="h-3 w-3" />
                                                                                )}
                                                                                Ver archivo
                                                                            </button>
                                                                        ) : (
                                                                            <span className="italic">Sin evidencia</span>
                                                                        )}

                                                                        {canManage && (
                                                                            <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 ml-auto inline-flex items-center gap-0.5 font-medium">
                                                                                <Upload className="h-3 w-3" />
                                                                                {isItemUploading ? '...' : act.evidencia_path ? 'Cambiar' : 'Subir'}
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*,.pdf"
                                                                                    className="hidden"
                                                                                    disabled={isItemUploading}
                                                                                    onChange={(e) => {
                                                                                        const f = e.target.files?.[0];
                                                                                        if (f) handleUploadEvidencia(act.id, f);
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {act.observaciones && (
                                                                    <p className="text-[11px] text-muted-foreground italic pl-1">
                                                                        Nota: “{act.observaciones}”
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}

