import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    FileText,
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Stethoscope,
    HelpCircle,
    Check,
    X,
    Sliders,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ModuleHeader } from '@/components/module-header';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Pregunta {
    id: string;
    label: string;
    tipo: 'texto' | 'si_no' | 'opcion_multiple' | 'escala_1_10';
    obligatorio?: boolean;
    alerta_si?: string;
}

interface Plantilla {
    id: number;
    titulo: string;
    descripcion?: string;
    especialidad_id?: number;
    tipo_atencion_id?: number;
    preguntas: Pregunta[];
    is_active: boolean;
    especialidad?: { nombre: string };
    tipoAtencion?: { nombre: string };
}

interface Especialidad {
    id: number;
    nombre: string;
}

interface TipoAtencion {
    id: number;
    nombre: string;
}

interface Props {
    plantillas: Plantilla[];
    especialidades: Especialidad[];
    tiposAtencion: TipoAtencion[];
    selectedEspecialidadId?: string;
}

export default function Index({ plantillas, especialidades, tiposAtencion, selectedEspecialidadId }: Props) {
    const __ = (key: string) => key;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        titulo: '',
        descripcion: '',
        especialidad_id: selectedEspecialidadId ? selectedEspecialidadId.toString() : 'none',
        tipo_atencion_id: 'none',
        is_active: true,
        preguntas: [
            {
                id: 'p1',
                label: '¿Cuál es el motivo principal de su consulta hoy?',
                tipo: 'texto',
                obligatorio: true,
            },
        ] as Pregunta[],
    });

    React.useEffect(() => {
        if (selectedEspecialidadId) {
            const espObj = especialidades.find((e) => e.id.toString() === selectedEspecialidadId.toString());
            const existingPlantilla = plantillas.find((p) => p.especialidad_id?.toString() === selectedEspecialidadId.toString());

            if (existingPlantilla) {
                handleEditClick(existingPlantilla);
            } else {
                setData((prev) => ({
                    ...prev,
                    titulo: espObj ? `Cuestionario de Pre-Consulta - ${espObj.nombre}` : prev.titulo,
                    especialidad_id: selectedEspecialidadId.toString(),
                }));
                setIsModalOpen(true);
            }
        }
    }, [selectedEspecialidadId]);


    const handleCreateClick = () => {
        setEditingPlantilla(null);
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (p: Plantilla) => {
        setEditingPlantilla(p);
        setData({
            titulo: p.titulo,
            descripcion: p.descripcion || '',
            especialidad_id: p.especialidad_id ? p.especialidad_id.toString() : 'none',
            tipo_atencion_id: p.tipo_atencion_id ? p.tipo_atencion_id.toString() : 'none',
            is_active: p.is_active,
            preguntas: p.preguntas || [],
        });
        setIsModalOpen(true);
    };

    const handleAddPregunta = () => {
        setData('preguntas', [
            ...data.preguntas,
            {
                id: `p_${Date.now()}`,
                label: '',
                tipo: 'texto',
                obligatorio: false,
            },
        ]);
    };

    const handleRemovePregunta = (idx: number) => {
        const copy = [...data.preguntas];
        copy.splice(idx, 1);
        setData('preguntas', copy);
    };

    const handlePreguntaChange = (idx: number, field: string, value: any) => {
        const copy = [...data.preguntas];
        copy[idx] = { ...copy[idx], [field]: value };
        setData('preguntas', copy);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            especialidad_id: data.especialidad_id === 'none' ? null : data.especialidad_id,
            tipo_atencion_id: data.tipo_atencion_id === 'none' ? null : data.tipo_atencion_id,
        };

        if (editingPlantilla) {
            put(`/admin/plantillas-preconsulta/${editingPlantilla.id}`, {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post('/admin/plantillas-preconsulta', {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (p: Plantilla) => {
        if (confirm(__('¿Estás seguro de eliminar esta plantilla de pre-consulta?'))) {
            router.delete(`/admin/plantillas-preconsulta/${p.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="space-y-6">
            <ModuleHeader
                title={__('Plantillas de Pre-Consulta')}
                description={__('Configuración de cuestionarios clínicos automáticos por especialidad para sala de espera.')}
                icon={<FileText className="h-6 w-6" />}
                action={
                    <Button onClick={handleCreateClick} className="bg-primary hover:bg-primary/90 rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        {__('Nueva Plantilla')}
                    </Button>
                }
            />

            {/* Listado de Plantillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plantillas.map((p) => (
                    <div key={p.id} className="p-5 bg-card rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {p.especialidad?.nombre || 'General / Global'}
                                </Badge>
                                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                                    {p.is_active ? 'Activa' : 'Inactiva'}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="font-bold text-base text-foreground">{p.titulo}</h3>
                                {p.descripcion && <p className="text-xs text-muted-foreground mt-1">{p.descripcion}</p>}
                            </div>

                            <div className="p-3 bg-muted/40 rounded-2xl border space-y-1 text-xs">
                                <span className="font-bold text-muted-foreground block">{__('Preguntas inclídas:')} ({p.preguntas?.length || 0})</span>
                                <ul className="space-y-1 pl-1">
                                    {p.preguntas?.slice(0, 3).map((q, idx) => (
                                        <li key={idx} className="truncate text-foreground font-medium flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            {q.label}
                                        </li>
                                    ))}
                                    {p.preguntas?.length > 3 && (
                                        <li className="text-[10px] text-muted-foreground pl-3">
                                            +{p.preguntas.length - 3} preguntas adicionales...
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(p)} className="rounded-xl">
                                <Edit2 className="h-4 w-4 mr-1" />
                                {__('Editar')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="text-rose-500 hover:bg-rose-500/10 rounded-xl">
                                <Trash2 className="h-4 w-4 mr-1" />
                                {__('Eliminar')}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Crear / Editar Plantilla */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-full sm:max-w-3xl rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {editingPlantilla ? __('Editar Plantilla de Pre-Consulta') : __('Nueva Plantilla de Pre-Consulta')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{__('Título de la Plantilla *')}</Label>
                                <Input
                                    value={data.titulo}
                                    onChange={(e) => setData('titulo', e.target.value)}
                                    placeholder="Ej. Cuestionario de Cardiología Pre-Consulta"
                                    className="h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{__('Especialidad Asociada')}</Label>
                                <Select value={data.especialidad_id} onValueChange={(val) => setData('especialidad_id', val)}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{__('General (Cualquier especialidad)')}</SelectItem>
                                        {especialidades.map((e) => (
                                            <SelectItem key={e.id} value={e.id.toString()}>
                                                {e.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{__('Descripción o Instrucciones para el Paciente')}</Label>
                            <Textarea
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                placeholder="Escribe instrucciones para el paciente..."
                                className="rounded-xl min-h-[70px]"
                            />
                        </div>

                        {/* Constructor Dinámico de Preguntas */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-primary" />
                                    {__('Preguntas del Cuestionario')}
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddPregunta} className="rounded-xl">
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    {__('Agregar Pregunta')}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {data.preguntas.map((p, idx) => (
                                    <div key={idx} className="p-4 bg-muted/40 rounded-2xl border space-y-3 relative group">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs">{__('Pregunta')} #{idx + 1}</Label>
                                                <Input
                                                    value={p.label}
                                                    onChange={(e) => handlePreguntaChange(idx, 'label', e.target.value)}
                                                    placeholder="Ej. ¿Ha tenido fiebre en las últimas 48 horas?"
                                                    className="h-10 rounded-xl bg-background"
                                                />
                                            </div>

                                            <div className="w-[160px] space-y-1">
                                                <Label className="text-xs">{__('Tipo de Respuesta')}</Label>
                                                <Select value={p.tipo} onValueChange={(val: any) => handlePreguntaChange(idx, 'tipo', val)}>
                                                    <SelectTrigger className="h-10 rounded-xl bg-background text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="texto">{__('Texto Libre')}</SelectItem>
                                                        <SelectItem value="si_no">{__('Sí / No')}</SelectItem>
                                                        <SelectItem value="escala_1_10">{__('Escala Dolor (1-10)')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemovePregunta(idx)}
                                                className="text-rose-500 hover:bg-rose-500/10 rounded-xl shrink-0 mt-5"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-primary hover:bg-primary/90 rounded-xl font-bold">
                                {editingPlantilla ? __('Guardar Cambios') : __('Crear Plantilla')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
