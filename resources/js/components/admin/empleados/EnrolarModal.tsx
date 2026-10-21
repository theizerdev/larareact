import React, { useEffect, useState } from 'react';
import {
    ScanFace,
    Send,
    Mail,
    Phone,
    Copy,
    Check,
    ExternalLink,
    Loader2,
    CheckCircle2,
    UserCheck,
    UserPlus,
    Building2,
    Hash,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import PhoneInputGroup from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

export interface EmpleadoSimple {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad?: string | null;
    telefono?: string | null;
    correo?: string | null;
    pais_telefono_id?: string | number | null;
    departamento_id?: number | null;
    enrolado_en?: string | null;
}

interface EnrolarModalProps {
    isOpen: boolean;
    onClose: () => void;
    empleados: EmpleadoSimple[];
    departamentos: { id: number; nombre: string }[];
    paises: { id: number; nombre: string; codigo_iso2?: string | null; codigo_telefonico?: string | null }[];
    preselectedEmpleado?: EmpleadoSimple | null;
    onSuccess?: () => void;
}

type CanalNotificacion = 'whatsapp' | 'correo' | 'ambos';

export function EnrolarModal({
    isOpen,
    onClose,
    empleados,
    departamentos,
    paises,
    preselectedEmpleado = null,
    onSuccess,
}: EnrolarModalProps) {
    const { __ } = useTranslate();

    // Buscar ID de país por defecto (México +52 si existe, o el primero)
    const defaultPaisId = paises.find(p => p.codigo_iso2 === 'MX' || p.codigo_telefonico === '+52' || p.codigo_telefonico === '52')?.id
        || (paises[0]?.id ?? '');

    const [mode, setMode] = useState<'existente' | 'nuevo'>('existente');
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [documentoIdentidad, setDocumentoIdentidad] = useState('');
    const [departamentoId, setDepartamentoId] = useState<string>('');
    const [canal, setCanal] = useState<CanalNotificacion>('whatsapp');
    const [paisTelefonoId, setPaisTelefonoId] = useState<string | number>(defaultPaisId);
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ link: string; message: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sincronizar cuando se pasa un colaborador preseleccionado o se abre
    useEffect(() => {
        if (!isOpen) {
            setResult(null);
            setErrors({});
            setCopied(false);
            return;
        }

        if (preselectedEmpleado) {
            setMode('existente');
            setSelectedEmpleadoId(String(preselectedEmpleado.id));
            setNombres(preselectedEmpleado.nombres || '');
            setApellidos(preselectedEmpleado.apellidos || '');
            setDocumentoIdentidad(preselectedEmpleado.documento_identidad || '');
            setDepartamentoId(preselectedEmpleado.departamento_id ? String(preselectedEmpleado.departamento_id) : '');
            setTelefono(preselectedEmpleado.telefono || '');
            setCorreo(preselectedEmpleado.correo || '');
            setPaisTelefonoId(preselectedEmpleado.pais_telefono_id || defaultPaisId);
        } else {
            setMode(empleados.length > 0 ? 'existente' : 'nuevo');
            setSelectedEmpleadoId('');
            setNombres('');
            setApellidos('');
            setDocumentoIdentidad('');
            setDepartamentoId('');
            setTelefono('');
            setCorreo('');
            setPaisTelefonoId(defaultPaisId);
        }
    }, [isOpen, preselectedEmpleado]);

    // Cuando el usuario cambia el colaborador existente en el select
    const handleEmpleadoSelect = (empId: string) => {
        setSelectedEmpleadoId(empId);
        setErrors({});
        const emp = empleados.find(e => String(e.id) === empId);
        if (emp) {
            setNombres(emp.nombres || '');
            setApellidos(emp.apellidos || '');
            setDocumentoIdentidad(emp.documento_identidad || '');
            setDepartamentoId(emp.departamento_id ? String(emp.departamento_id) : '');
            setTelefono(emp.telefono || '');
            setCorreo(emp.correo || '');
            if (emp.pais_telefono_id) {
                setPaisTelefonoId(emp.pais_telefono_id);
            }
        }
    };

    const handleCopy = () => {
        if (!result?.link) return;
        navigator.clipboard.writeText(result.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const payload: any = {
                canal,
            };

            if (mode === 'existente') {
                if (!selectedEmpleadoId) {
                    setErrors({ empleado_id: 'Debe seleccionar un colaborador.' });
                    setLoading(false);
                    return;
                }
                payload.empleado_id = selectedEmpleadoId;
            } else {
                payload.nombres = nombres;
                payload.apellidos = apellidos;
                payload.documento_identidad = documentoIdentidad || null;
                payload.departamento_id = departamentoId || null;
            }

            if (telefono) {
                payload.pais_telefono_id = paisTelefonoId;
                payload.telefono = telefono;
            }

            if (correo) {
                payload.correo = correo;
            }

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/admin/empleados/enrolamiento/invitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();

            if (res.ok && responseData.success) {
                setResult({
                    link: responseData.link,
                    message: responseData.message,
                });
                onSuccess?.();
            } else if (res.status === 422 && responseData.errors) {
                const formattedErrors: Record<string, string> = {};
                Object.keys(responseData.errors).forEach(key => {
                    formattedErrors[key] = responseData.errors[key][0];
                });
                setErrors(formattedErrors);
            } else {
                setErrors({ general: responseData.message || 'Ocurrió un error al generar la invitación.' });
            }
        } catch (err: any) {
            setErrors({ general: err?.message || 'Error de conexión al generar la invitación.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 p-0 sm:rounded-2xl">
                {/* Cabecera estilizada */}
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <ScanFace className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white">
                                {__('Enrolamiento de Colaborador')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-indigo-100 mt-0.5">
                                {__('Genere y envíe un enlace para captura biométrica y sincronización con BioTime.')}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Pantalla de Éxito con Link Generado */}
                    {result ? (
                        <div className="space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    {__('¡Enlace de Enrolamiento Generado!')}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {result.message}
                                </p>
                            </div>

                            {/* Caja del Enlace */}
                            <div className="space-y-2 text-left">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {__('Enlace de enrolamiento para el colaborador:')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={result.link}
                                        className="font-mono text-xs bg-slate-50 dark:bg-slate-900 select-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className={cn(
                                            'shrink-0 gap-1.5 transition-all',
                                            copied && 'border-emerald-500 text-emerald-600 bg-emerald-50'
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4 text-emerald-600" />
                                                <span>{__('Copiado')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                <span>{__('Copiar')}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Acciones del éxito */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-3">
                                <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button
                                        type="button"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        {__('Abrir Enrolamiento')}
                                    </Button>
                                </a>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setResult(null);
                                        onClose();
                                    }}
                                    className="flex-1"
                                >
                                    {__('Cerrar')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Formulario de Solicitud de Enrolamiento */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errors.general && (
                                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
                                    {errors.general}
                                </div>
                            )}

                            {/* Selector de Modo: Existente vs Nuevo */}
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('existente');
                                        setErrors({});
                                    }}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all',
                                        mode === 'existente'
                                            ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                                    )}
                                >
                                    <UserCheck className="h-3.5 w-3.5" />
                                    {__('Colaborador existente')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('nuevo');
                                        setSelectedEmpleadoId('');
                                        setErrors({});
                                    }}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-semibold transition-all',
                                        mode === 'nuevo'
                                            ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                                    )}
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    {__('Nuevo colaborador')}
                                </button>
                            </div>

                            {/* SECCIÓN A: COLABORADOR EXISTENTE */}
                            {mode === 'existente' && (
                                <div className="space-y-2">
                                    <Label htmlFor="empleado_select" className="text-xs font-semibold">
                                        {__('Seleccione el colaborador')} <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select value={selectedEmpleadoId} onValueChange={handleEmpleadoSelect}>
                                        <SelectTrigger
                                            id="empleado_select"
                                            className={cn(errors.empleado_id && 'border-rose-500')}
                                        >
                                            <SelectValue placeholder={__('Buscar colaborador de la lista...')} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-56">
                                            {empleados.map((emp) => (
                                                <SelectItem key={emp.id} value={String(emp.id)}>
                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                        <span className="font-medium">
                                                            {emp.nombres} {emp.apellidos}
                                                        </span>
                                                        <span className={cn(
                                                            'text-[10px] px-1.5 py-0.5 rounded font-mono',
                                                            emp.enrolado_en
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        )}>
                                                            {emp.enrolado_en ? 'Enrolado' : 'Sin enrolar'}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.empleado_id && (
                                        <p className="text-xs text-rose-500">{errors.empleado_id}</p>
                                    )}

                                    {/* Resumen del colaborador seleccionado */}
                                    {selectedEmpleadoId && (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1 dark:border-slate-800 dark:bg-slate-900/40">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                {nombres} {apellidos}
                                            </p>
                                            {documentoIdentidad && (
                                                <p className="text-muted-foreground font-mono">
                                                    N° EMPLEADO: {documentoIdentidad}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SECCIÓN B: REGISTRO DE NUEVO COLABORADOR */}
                            {mode === 'nuevo' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new_nombres" className="text-xs">
                                                {__('Nombres')} <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="new_nombres"
                                                value={nombres}
                                                onChange={(e) => setNombres(e.target.value)}
                                                placeholder="Ej. Juan Carlos"
                                                className={cn(errors.nombres && 'border-rose-500')}
                                                required
                                            />
                                            {errors.nombres && (
                                                <p className="text-xs text-rose-500">{errors.nombres}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="new_apellidos" className="text-xs">
                                                {__('Apellidos')} <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                id="new_apellidos"
                                                value={apellidos}
                                                onChange={(e) => setApellidos(e.target.value)}
                                                placeholder="Ej. Pérez Gómez"
                                                className={cn(errors.apellidos && 'border-rose-500')}
                                                required
                                            />
                                            {errors.apellidos && (
                                                <p className="text-xs text-rose-500">{errors.apellidos}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new_doc" className="text-xs">
                                                {__('No. de Empleado (Opcional)')}
                                            </Label>
                                            <div className="relative">
                                                <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="new_doc"
                                                    value={documentoIdentidad}
                                                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                                                    placeholder="1234"
                                                    className="pl-8 font-mono text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="new_depto" className="text-xs">
                                                {__('Área / Departamento')}
                                            </Label>
                                            <Select value={departamentoId} onValueChange={setDepartamentoId}>
                                                <SelectTrigger id="new_depto">
                                                    <SelectValue placeholder={__('Seleccionar área')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departamentos.map((dep) => (
                                                        <SelectItem key={dep.id} value={String(dep.id)}>
                                                            {dep.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN C: CANAL DE ENVÍO */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {__('Canal de entrega del enlace')}
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        {
                                            id: 'whatsapp',
                                            label: 'WhatsApp',
                                            icon: Phone,
                                            desc: 'Vía telefónica',
                                        },
                                        {
                                            id: 'correo',
                                            label: 'Correo',
                                            icon: Mail,
                                            desc: 'Email',
                                        },
                                        {
                                            id: 'ambos',
                                            label: 'Ambos',
                                            icon: Send,
                                            desc: 'WhatsApp + Email',
                                        },
                                    ].map((c) => {
                                        const Icon = c.icon;
                                        const isSelected = canal === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setCanal(c.id as CanalNotificacion)}
                                                className={cn(
                                                    'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all',
                                                    isSelected
                                                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm dark:bg-indigo-950/30 dark:border-indigo-500 dark:text-indigo-300'
                                                        : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                                                )}
                                            >
                                                <Icon className={cn('h-4 w-4 mb-1', isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500')} />
                                                <span className="text-xs font-bold leading-tight">{c.label}</span>
                                                <span className="text-[10px] text-muted-foreground">{c.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CAMPOS DE CONTACTO */}
                            {/* 1. Teléfono con PhoneInputGroup */}
                            <div className="space-y-1.5 animate-in fade-in duration-200">
                                <Label className="text-xs font-semibold">
                                    {__('Número Telefónico')} {canal !== 'correo' ? <span className="text-rose-500">* (WhatsApp)</span> : <span className="text-slate-400 font-normal">({__('Opcional')})</span>}
                                </Label>
                                <PhoneInputGroup
                                    paises={paises}
                                    selectedPaisId={paisTelefonoId}
                                    phoneValue={telefono}
                                    onPaisChange={setPaisTelefonoId}
                                    onPhoneChange={setTelefono}
                                    placeholder="000-0000000"
                                    error={errors.telefono || errors.pais_telefono_id}
                                />
                                {(errors.telefono || errors.pais_telefono_id) && (
                                    <p className="text-xs text-rose-500 mt-1">
                                        {errors.telefono || errors.pais_telefono_id}
                                    </p>
                                )}
                            </div>

                            {/* 2. Correo Electrónico */}
                            <div className="space-y-1.5 animate-in fade-in duration-200">
                                <Label htmlFor="enrolar_correo" className="text-xs font-semibold">
                                    {__('Dirección de Correo Electrónico')} {canal !== 'whatsapp' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">({__('Opcional, recomendado para BioTime')})</span>}
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="enrolar_correo"
                                        type="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        placeholder="colaborador@smurfitwestrock.com"
                                        className={cn('pl-8 text-xs', errors.correo && 'border-rose-500')}
                                        required={canal === 'correo' || canal === 'ambos'}
                                    />
                                </div>
                                {errors.correo && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.correo}</p>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    {__('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{__('Generando enlace...')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>{__('Enviar enlace de enrolamiento')}</span>
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default EnrolarModal;
