import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Stethoscope,
    CheckCircle2,
    Clock,
    User,
    AlertTriangle,
    Send,
    Calendar,
    ChevronRight,
    Heart,
    FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Pregunta {
    id: string;
    label: string;
    tipo: 'texto' | 'si_no' | 'opcion_multiple' | 'escala_1_10';
    opciones?: string[];
    obligatorio?: boolean;
    alerta_si?: string;
}

interface CitaPreconsulta {
    id: number;
    token: string;
    completado: boolean;
    completado_at?: string;
    respuestas?: Record<string, any>;
    plantilla?: {
        titulo: string;
        descripcion?: string;
        preguntas: Pregunta[];
    };
    cita?: {
        codigo_cita: string;
        fecha_hora_inicio: string;
        paciente?: {
            nombres: string;
            apellidos: string;
            nombre_mascota?: string;
            tipo_paciente: string;
        };
        medico?: {
            nombres: string;
            apellidos: string;
        };
        especialidad?: {
            nombre: string;
        };
    };
}

interface Props {
    preconsulta: CitaPreconsulta;
}

export default function Show({ preconsulta }: Props) {
    const plantilla = preconsulta.plantilla;
    const preguntas = plantilla?.preguntas || [];
    const cita = preconsulta.cita;

    const [respuestasState, setRespuestasState] = useState<Record<string, any>>(
        preconsulta.respuestas || {}
    );
    const [submitted, setSubmitted] = useState(preconsulta.completado);

    const { post, processing } = useForm();

    const handleAnswerChange = (preguntaId: string, val: any) => {
        setRespuestasState((prev) => ({
            ...prev,
            [preguntaId]: val,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/preconsulta/${preconsulta.token}`,
            { respuestas: respuestasState },
            {
                onSuccess: () => setSubmitted(true),
            }
        );
    };

    // Calculate progress
    const answeredCount = Object.keys(respuestasState).filter(
        (k) => respuestasState[k] !== undefined && respuestasState[k] !== ''
    ).length;
    const progressPercent = preguntas.length > 0 ? Math.round((answeredCount / preguntas.length) * 100) : 100;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
            {/* Header Móvil */}
            <div className="max-w-md mx-auto w-full space-y-4 pt-2">
                <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 backdrop-blur-md shadow-xl">
                    <div className="flex items-center space-x-3">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm text-slate-100">
                                {cita?.especialidad?.nombre || 'Consulta Médica'}
                            </h1>
                            <p className="text-xs text-slate-400">
                                Dr(a). {cita?.medico?.nombres} {cita?.medico?.apellidos}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                        {cita?.codigo_cita}
                    </Badge>
                </div>

                {/* Saludo Paciente */}
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 rounded-3xl border border-emerald-500/30 space-y-1">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Pre-Consulta en Sala de Espera</span>
                    <h2 className="text-lg font-extrabold text-white">
                        Hola, {cita?.paciente?.tipo_paciente === 'animal' ? cita.paciente.nombre_mascota : cita?.paciente?.nombres}! 👋
                    </h2>
                    <p className="text-xs text-slate-300">
                        {plantilla?.descripcion || 'Por favor completa este breve cuestionario para que tu médico revise tus síntomas antes de ingresar.'}
                    </p>
                </div>
            </div>

            {/* Formulario Principal de Preguntas */}
            <div className="max-w-md mx-auto w-full flex-1 my-6 space-y-6">
                {submitted ? (
                    <div className="bg-slate-800/90 p-6 rounded-3xl border border-emerald-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
                        <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">¡Cuestionario Enviado!</h3>
                            <p className="text-xs text-slate-300">
                                Tus respuestas han sido recibidas exitosamente y están vinculadas a tu ficha médica.
                            </p>
                        </div>
                        <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-400" />
                            <span>Por favor aguarda el llamado del médico en recepción.</span>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Barra de Progreso */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-400 px-1">
                                <span>Progreso</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2 rounded-full bg-slate-800" />
                        </div>

                        {/* Preguntas */}
                        <div className="space-y-4">
                            {preguntas.map((p, idx) => {
                                const val = respuestasState[p.id];

                                return (
                                    <div
                                        key={p.id}
                                        className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700/60 space-y-3 shadow-lg"
                                    >
                                        <Label className="text-sm font-bold text-slate-200 block">
                                            {idx + 1}. {p.label} {p.obligatorio && <span className="text-rose-400">*</span>}
                                        </Label>

                                        {/* Opción Sí / No */}
                                        {p.tipo === 'si_no' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAnswerChange(p.id, 'Si')}
                                                    className={cn(
                                                        'p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer',
                                                        val === 'Si'
                                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-95'
                                                            : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-700/50'
                                                    )}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" /> Sí
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAnswerChange(p.id, 'No')}
                                                    className={cn(
                                                        'p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer',
                                                        val === 'No'
                                                            ? 'bg-slate-700 text-white border-slate-600 shadow-md scale-95'
                                                            : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-700/50'
                                                    )}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        )}

                                        {/* Escala Dolor 1 al 10 */}
                                        {p.tipo === 'escala_1_10' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                                                    <span>1 (Mínimo)</span>
                                                    <span>10 (Severo)</span>
                                                </div>
                                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => handleAnswerChange(p.id, n)}
                                                            className={cn(
                                                                'h-10 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center cursor-pointer',
                                                                val === n
                                                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-105'
                                                                    : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-700'
                                                            )}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Texto Libre */}
                                        {p.tipo === 'texto' && (
                                            <Textarea
                                                value={val || ''}
                                                onChange={(e) => handleAnswerChange(p.id, e.target.value)}
                                                placeholder="Escribe tu respuesta aquí..."
                                                className="bg-slate-900/60 border-slate-700 text-slate-100 rounded-2xl min-h-[80px] text-xs focus-visible:ring-emerald-500"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || answeredCount === 0}
                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Send className="h-4 w-4" />
                            Enviar Respuestas al Médico
                        </Button>
                    </form>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-md mx-auto w-full text-center text-[10px] text-slate-500 pb-2">
                SISMED Medical Platform • Pre-Consulta Segura
            </div>
        </div>
    );
}
