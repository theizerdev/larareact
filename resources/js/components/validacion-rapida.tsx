import { usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Loader2, ScanFace, ShieldCheck, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslate } from '@/hooks/use-translate';
import { validarCurp } from '@/utils/curpValidator';

type Entidad = 'proveedor' | 'socio-comercial' | 'responsable' | 'colaborador';

interface Resultado {
    id: number;
    estatus: 'pendiente' | 'procesando' | 'aprobado' | 'revision' | 'rechazado' | 'error';
    finalizada: boolean;
    score: number | null;
    observaciones: string | null;
    error_detalle: string | null;
}

/** RFC de persona moral (12) o física (13); mismo patrón que valida el servidor. */
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{2}[A\d]$/u;

export const normalizarRfc = (rfc: string) => rfc.toUpperCase().replace(/[\s-]/g, '');

function xsrf(): string {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return m ? decodeURIComponent(m[1]) : '';
}

/** Mientras TRUORA trabaja se consulta cada 6 s, hasta 3 minutos. */
const INTERVALO_MS = 6000;
const MAX_CONSULTAS = 30;

function usePuedeValidar(): boolean {
    const { props } = usePage();
    const user = (props as { auth?: { user?: { permissions?: string[] } } }).auth?.user;

    return !!user?.permissions?.includes('validaciones.manage');
}

/** Cada consulta a un proveedor tiene costo: se confirma antes de lanzarla. */
function ConfirmarValidacion({
    abierto,
    titulo,
    descripcion,
    onCancelar,
    onConfirmar,
}: {
    abierto: boolean;
    titulo: string;
    descripcion: ReactNode;
    onCancelar: () => void;
    onConfirmar: () => void;
}) {
    const { __ } = useTranslate();

    return (
        <AlertDialog open={abierto} onOpenChange={(open) => !open && onCancelar()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{titulo}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2">
                            {descripcion}
                            <p className="font-medium text-amber-700 dark:text-amber-400">{__('Esta consulta tiene costo.')}</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">{__('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction type="button" onClick={onConfirmar} className="bg-emerald-600 text-white hover:bg-emerald-700">
                        {__('Sí, validar')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Envuelve el campo RFC o CURP de un formulario de alta: cuando el dato está
 * completo y bien formado aparece un botón "Validar" dentro del campo.
 *  - RFC: antecedentes de la empresa con TRUORA (tarda unos minutos).
 *  - CURP: que exista en RENAPO y corresponda al nombre capturado (DIDIT).
 * Al guardar el registro, el resultado queda en su folio (Resultados de validaciones).
 */
export function ValidacionRapida({
    tipo,
    valor,
    nombre,
    entidad,
    empresaId,
    className,
    children,
}: {
    tipo: 'rfc' | 'curp';
    valor: string | null | undefined;
    /** RFC: razón social. CURP: nombre completo de la persona. */
    nombre?: string | null;
    entidad: Entidad;
    empresaId?: number | string | null;
    className?: string;
    children: ReactNode;
}) {
    const { __ } = useTranslate();
    const puede = usePuedeValidar();

    const dato = tipo === 'rfc' ? normalizarRfc(valor || '') : (valor || '').trim().toUpperCase();
    const nombreLimpio = (nombre || '').trim().replace(/\s+/g, ' ');
    const clave = `${dato}|${tipo === 'curp' ? nombreLimpio.toUpperCase() : ''}`;

    const listo =
        tipo === 'rfc'
            ? RFC_REGEX.test(dato)
            : dato.length === 18 && validarCurp(dato).isValid && nombreLimpio.split(' ').length >= 2;

    const [enviando, setEnviando] = useState(false);
    const [resultado, setResultado] = useState<(Resultado & { clave: string }) | null>(null);
    const [avisoDe, setAvisoDe] = useState<{ clave: string; texto: string } | null>(null);
    const [agotado, setAgotado] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const consultas = useRef(0);

    // Si cambia el dato (o el nombre), el resultado y el aviso anteriores ya no aplican.
    const vigente = resultado && resultado.clave === clave ? resultado : null;
    const aviso = avisoDe && avisoDe.clave === clave ? avisoDe.texto : null;
    const setAviso = (texto: string | null) => setAvisoDe(texto ? { clave, texto } : null);

    // TRUORA: seguir consultando mientras el check esté abierto.
    useEffect(() => {
        if (!vigente || vigente.finalizada) {
            return;
        }

        const timer = window.setInterval(async () => {
            consultas.current += 1;

            if (consultas.current > MAX_CONSULTAS) {
                window.clearInterval(timer);
                setAgotado(true);

                return;
            }

            try {
                const res = await fetch(`/admin/validaciones/previa/${vigente.id}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (res.ok) {
                    const json = (await res.json()) as Resultado;
                    setResultado({ ...json, clave: vigente.clave });
                }
            } catch {
                // se reintenta en la siguiente vuelta
            }
        }, INTERVALO_MS);

        return () => window.clearInterval(timer);
    }, [vigente?.id, vigente?.finalizada, vigente?.clave]); // eslint-disable-line react-hooks/exhaustive-deps

    const validar = async () => {
        setEnviando(true);
        setAviso(null);
        setAgotado(false);
        consultas.current = 0;

        try {
            const res = await fetch(`/admin/validaciones/previa/${tipo}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrf(),
                },
                credentials: 'same-origin',
                body: JSON.stringify(
                    tipo === 'rfc'
                        ? { rfc: dato, razon_social: nombreLimpio || null, entidad, empresa_id: empresaId || null }
                        : { curp: dato, nombre: nombreLimpio, entidad, empresa_id: empresaId || null },
                ),
            });

            const json = await res.json().catch(() => ({}));

            if (res.ok) {
                setResultado({ ...(json as Resultado), clave });
            } else if (res.status === 403) {
                setAviso(__('No tienes permiso para validar.'));
            } else if (res.status === 429) {
                setAviso(__('Demasiadas validaciones seguidas. Espera un minuto.'));
            } else {
                setAviso((json as { message?: string }).message || __('No se pudo validar. Intenta de nuevo.'));
            }
        } catch {
            setAviso(__('No se pudo conectar con el servidor.'));
        } finally {
            setEnviando(false);
        }
    };

    const mostrarBoton = puede && listo && !(vigente && !vigente.finalizada);

    return (
        <div className={className}>
            <div className="relative">
                {children}
                {mostrarBoton && (
                    <button
                        type="button"
                        onClick={() => setConfirmando(true)}
                        disabled={enviando}
                        title={tipo === 'rfc' ? __('Validar la empresa con su RFC') : __('Validar que la CURP corresponda al nombre')}
                        className="absolute top-1/2 right-1.5 inline-flex h-7 -translate-y-1/2 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {vigente ? __('Validar de nuevo') : __('Validar')}
                    </button>
                )}
            </div>

            {aviso && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {aviso}
                </p>
            )}

            {vigente && <ResultadoLinea r={vigente} tipo={tipo} agotado={agotado} />}

            <ConfirmarValidacion
                abierto={confirmando}
                titulo={tipo === 'rfc' ? __('¿Validar el RFC de la empresa?') : __('¿Validar la CURP de esta persona?')}
                descripcion={
                    <p>
                        {tipo === 'rfc'
                            ? __('Se consultarán los antecedentes de la empresa con el RFC :rfc en TRUORA.', { rfc: dato })
                            : __('Se consultará en RENAPO (DIDIT) que la CURP :curp corresponda a :nombre.', { curp: dato, nombre: nombreLimpio })}
                    </p>
                }
                onCancelar={() => setConfirmando(false)}
                onConfirmar={() => {
                    setConfirmando(false);
                    validar();
                }}
            />
        </div>
    );
}

/**
 * Casilla "Validar identidad al guardar" para los formularios de alta. Nada se
 * valida solo: el usuario la marca (con confirmación, porque tiene costo) y al
 * guardar se validan el INE o pasaporte y la foto (lectura del documento y
 * comparación facial). Sólo se puede marcar con el documento y la foto cargados.
 */
export function ValidarIdentidadAlGuardar({
    listo,
    value,
    onChange,
    pasaporte = false,
    className,
}: {
    /** Ya hay documento (frente) y foto de la persona en el formulario. */
    listo: boolean;
    value: boolean;
    onChange: (value: boolean) => void;
    pasaporte?: boolean;
    className?: string;
}) {
    const { __ } = useTranslate();
    const puede = usePuedeValidar();
    const [confirmando, setConfirmando] = useState(false);

    // Si quitan el documento o la foto, la casilla deja de aplicar.
    useEffect(() => {
        if (!listo && value) {
            onChange(false);
        }
    }, [listo]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!puede) {
        return null;
    }

    const documento = pasaporte ? __('el pasaporte') : __('el INE');

    return (
        <div
            className={`rounded-lg border p-3 ${
                value && listo
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-800'
            } ${className ?? ''}`}
        >
            <label className={`flex items-start gap-2.5 ${listo ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                <Checkbox
                    checked={value && listo}
                    disabled={!listo}
                    onCheckedChange={(checked) => (checked ? setConfirmando(true) : onChange(false))}
                    className="mt-0.5"
                />
                <span className="text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                        <ScanFace className="h-4 w-4 text-emerald-600" />
                        {__('Validar identidad al guardar')}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                        {listo
                            ? __('Se validan :documento y la foto (lectura del documento y comparación facial). Opcional: después también se puede validar desde el menú Validar.', { documento })
                            : __('Carga :documento (frente) y la foto para poder validar la identidad.', { documento })}
                    </span>
                </span>
            </label>

            <ConfirmarValidacion
                abierto={confirmando}
                titulo={__('¿Validar la identidad de esta persona?')}
                descripcion={
                    <p>{__('Al guardar, :documento y la foto se enviarán a validación de identidad (lectura del documento y comparación facial).', { documento })}</p>
                }
                onCancelar={() => setConfirmando(false)}
                onConfirmar={() => {
                    setConfirmando(false);
                    onChange(true);
                }}
            />
        </div>
    );
}

function ResultadoLinea({ r, tipo, agotado }: { r: Resultado; tipo: 'rfc' | 'curp'; agotado: boolean }) {
    const { __ } = useTranslate();

    if (!r.finalizada) {
        return (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-sky-700 dark:text-sky-300">
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                {agotado
                    ? __('TRUORA sigue procesando. Puedes guardar: el resultado quedará en Resultados de validaciones.')
                    : __('Consultando antecedentes de la empresa en TRUORA… puede tardar unos minutos. Puedes seguir llenando el formulario.')}
            </p>
        );
    }

    const meta: Record<string, { cls: string; icono: ReactNode; titulo: string }> = {
        aprobado: {
            cls: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
            icono: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />,
            titulo: tipo === 'rfc' ? __('Empresa sin hallazgos relevantes') : __('Nombre y CURP verificados'),
        },
        revision: {
            cls: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
            icono: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />,
            titulo: __('Requiere revisión'),
        },
        rechazado: {
            cls: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
            icono: <XCircle className="mt-0.5 h-4 w-4 shrink-0" />,
            titulo: tipo === 'rfc' ? __('Con alertas') : __('No coincide'),
        },
        error: {
            cls: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
            icono: <XCircle className="mt-0.5 h-4 w-4 shrink-0" />,
            titulo: __('No se pudo validar'),
        },
    };
    const m = meta[r.estatus] ?? meta.error;

    return (
        <div className={`mt-1.5 flex items-start gap-2 rounded-lg border p-2 text-xs ${m.cls}`}>
            {m.icono}
            <div>
                <div className="font-semibold">
                    {m.titulo}
                    {r.score !== null && <span className="ml-1 font-normal opacity-80">· score {r.score.toFixed(2)}</span>}
                </div>
                {(r.observaciones || r.error_detalle) && <div className="mt-0.5">{r.observaciones || r.error_detalle}</div>}
            </div>
        </div>
    );
}
