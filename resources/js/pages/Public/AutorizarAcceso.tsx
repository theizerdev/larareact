import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { 
    ShieldCheck, 
    User, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertTriangle, 
    Building, 
    FileText,
    Send,
    Check,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface AutorizarAccesoProps {
    autorizacion: {
        id: number;
        token: string;
        status: 'pendiente' | 'autorizado' | 'rechazado';
        motivo_autorizacion?: string | null;
        autorizado_at?: string | null;
        responsable?: {
            nombre: string;
            correo?: string;
        } | null;
        empleado?: {
            nombres: string;
            apellidos: string;
            documento_identidad: string;
            foto_empleado?: string | null;
            departamento?: string | null;
            cargo?: string | null;
            jornada_laboral?: any;
        } | null;
        datos_solicitud?: any;
        empresa?: {
            razon_social: string;
            logo?: string | null;
        } | null;
    };
}

export default function AutorizarAcceso({ autorizacion }: AutorizarAccesoProps) {
    const [accion, setAccion] = useState<'autorizar' | 'rechazar'>('autorizar');

    const { data, setData, post, processing, errors } = useForm({
        accion: 'autorizar',
        motivo_autorizacion: autorizacion.motivo_autorizacion || '',
    });

    const handleSubmit = (e: React.FormEvent, act: 'autorizar' | 'rechazar') => {
        e.preventDefault();
        setAccion(act);

        post(`/autorizar-acceso/${autorizacion.token}`, {
            data: {
                accion: act,
                motivo_autorizacion: data.motivo_autorizacion,
            },
            onSuccess: () => {
                if (act === 'autorizar') {
                    notifySuccess('Acceso autorizado correctamente. La garita de seguridad ha sido notificada al instante.');
                } else {
                    notifyError('Acceso rechazado.');
                }
            },
            onError: () => {
                notifyError('Por favor complete la justificación del motivo.');
            },
        });
    };

    const empNombre = autorizacion.empleado
        ? `${autorizacion.empleado.nombres} ${autorizacion.empleado.apellidos}`
        : autorizacion.datos_solicitud?.empleado_nombre || 'Empleado';

    const empDoc = autorizacion.empleado?.documento_identidad || autorizacion.datos_solicitud?.empleado_documento || 'N/A';

    return (
        <>
            <Head title={`Autorización de Acceso - ${empNombre}`} />

            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6">
                <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border overflow-hidden">
                    
                    {/* Header Institucional */}
                    <div className="bg-[#104a29] p-6 text-white text-center relative">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-300" />
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight">
                            {autorizacion.empresa?.razon_social || 'Control de Accesos'}
                        </h1>
                        <p className="text-emerald-100/80 text-xs mt-1">
                            Portal de Autorización Excepcional para Responsables
                        </p>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Si ya fue procesado */}
                        {autorizacion.status === 'autorizado' && (
                            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
                                <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                                    ¡Acceso Autorizado Exitosamente!
                                </h3>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                    El permiso de ingreso fue registrado a las <span className="font-semibold">{autorizacion.autorizado_at}</span>. El personal de seguridad en garita ya cuenta con la aprobación.
                                </p>
                                {autorizacion.motivo_autorizacion && (
                                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl text-left border text-xs text-slate-700 dark:text-slate-300">
                                        <span className="font-bold block text-slate-500 text-[10px] uppercase">Motivo registrado:</span>
                                        "{autorizacion.motivo_autorizacion}"
                                    </div>
                                )}
                            </div>
                        )}

                        {autorizacion.status === 'rechazado' && (
                            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2">
                                <XCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto" />
                                <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">
                                    Solicitud de Acceso Rechazada
                                </h3>
                                <p className="text-xs text-rose-700 dark:text-rose-300">
                                    Usted ha denegado el ingreso a esta persona. La garita de seguridad no permitirá el acceso.
                                </p>
                            </div>
                        )}

                        {/* Tarjeta con Información del Empleado */}
                        <div className="border rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                            <div className="flex items-center justify-between border-b pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Información de la Solicitud
                                </span>
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                                    ⚠️ Ingreso Fuera de Horario
                                </Badge>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl border-2 border-white dark:border-slate-800 overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 shadow">
                                    {autorizacion.empleado?.foto_empleado ? (
                                        <img src={autorizacion.empleado.foto_empleado} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 m-3 text-slate-400" />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        {empNombre}
                                    </h2>
                                    <p className="text-xs font-mono text-slate-500">Documento: {empDoc}</p>
                                    {autorizacion.empleado?.departamento && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            Depto: {autorizacion.empleado.departamento} {autorizacion.empleado.cargo && `| ${autorizacion.empleado.cargo}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Formularios de Acción si está pendiente */}
                        {autorizacion.status === 'pendiente' && (
                            <form className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        Explique el motivo o justificación del acceso: <span className="text-rose-500">*</span>
                                    </Label>
                                    <Textarea
                                        placeholder="Ej: Autorizado para atender mantenimiento extraordinario de servidor o atención urgente..."
                                        value={data.motivo_autorizacion}
                                        onChange={(e) => setData('motivo_autorizacion', e.target.value)}
                                        className="bg-white dark:bg-slate-900 min-h-[90px] text-sm"
                                        required
                                    />
                                    {errors.motivo_autorizacion && (
                                        <p className="text-xs text-rose-500 font-medium">{errors.motivo_autorizacion}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <Button
                                        type="button"
                                        disabled={processing || !data.motivo_autorizacion || data.motivo_autorizacion.trim().length < 3}
                                        onClick={(e) => handleSubmit(e, 'autorizar')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-sm font-bold shadow-md gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Autorizar Acceso
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                        onClick={(e) => handleSubmit(e, 'rechazar')}
                                        className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 h-12 text-sm font-bold gap-2"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Rechazar Acceso
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/80 p-4 border-t text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Acceso seguro tokenizado con registro de auditoría.
                    </div>
                </div>
            </div>
        </>
    );
}

AutorizarAcceso.layout = null;
