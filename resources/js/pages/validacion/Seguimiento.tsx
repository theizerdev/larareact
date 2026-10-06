import { Head } from '@inertiajs/react';
import { CheckCircle, Clock, ExternalLink, FileSignature, Loader2, ScanFace, ShieldAlert, Smartphone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import LanguageToggle from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';

interface PasoIdentidad {
    id: number;
    persona: string | null;
    proveedor: 'jaak' | 'didit';
    tipo_documento: string | null;
    estatus: string;
    accion_url: string | null;
}

interface PasoFirma {
    id: number;
    nombre_documento: string;
    firmante: string | null;
    estatus: string;
    accion_url: string | null;
}

interface Estado {
    folio: string;
    estatus: string;
    identidad: PasoIdentidad[];
    firmas: PasoFirma[];
    expira_en: string | null;
}

interface PageProps {
    token: string;
    url: string;
    qr_svg: string;
    empresa: string | null;
    estado: Estado;
}

const ESTATUS_META: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    procesando: { label: 'Processing', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    aprobado: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    firmado: { label: 'Signed', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    revision: { label: 'Under review', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    cancelado: { label: 'Cancelled', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    error: { label: 'Error', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
};

/** Orígenes de los que se aceptan mensajes del iframe (postMessage). */
const ORIGENES = {
    didit: ['https://verify.didit.me'],
    firma: ['https://app.zapsign.co', 'https://app.zapsign.com.br'],
};

interface Activo {
    tipo: 'didit' | 'firma';
    url: string;
    titulo: string;
}

function Badge({ estatus }: { estatus: string }) {
    const { __ } = useTranslate();
    const meta = ESTATUS_META[estatus] ?? ESTATUS_META.pendiente;

    return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>{__(meta.label)}</span>;
}

export default function Seguimiento({ token, url, qr_svg, empresa, estado: inicial }: PageProps) {
    const { __ } = useTranslate();
    const [estado, setEstado] = useState<Estado>(inicial);
    // Paso abierto dentro de Hoshō (iframe de DIDIT o de ZapSign).
    const [activo, setActivo] = useState<Activo | null>(null);

    const refrescar = useCallback(async () => {
        try {
            const res = await fetch(`/validacion/${token}/estado`, { headers: { Accept: 'application/json' } });

            if (!res.ok) {
                return;
            }

            const nuevo: Estado = await res.json();
            setEstado(nuevo);
            // Al terminar, DIDIT / ZapSign regresan a esta liga dentro del panel:
            // si el paso abierto ya no está pendiente, se cierra el panel.
            const urls = [...nuevo.identidad, ...nuevo.firmas].map((p) => p.accion_url);
            setActivo((a) => (a && !urls.includes(a.url) ? null : a));
        } catch {
            // sin red: se reintenta en el siguiente ciclo
        }
    }, [token]);

    // DIDIT avisa con { type: 'didit:completed' } y ZapSign con 'zs-doc-signed':
    // se cierra el panel y se consulta el estatus de inmediato.
    useEffect(() => {
        if (!activo) {
            return;
        }

        const onMessage = (e: MessageEvent) => {
            if (!ORIGENES[activo.tipo].includes(e.origin)) {
                return;
            }

            const terminado = activo.tipo === 'didit'
                ? ['didit:completed', 'didit:cancelled'].includes(e.data?.type)
                : e.data === 'zs-doc-signed';

            if (terminado) {
                setActivo(null);
                window.setTimeout(refrescar, 1500);
            }
        };

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, [activo, refrescar]);

    const pendientes = [...estado.identidad, ...estado.firmas].filter((p) => p.accion_url);
    const enEspera = estado.identidad.some((p) => !p.accion_url && ['pendiente', 'procesando'].includes(p.estatus))
        || estado.firmas.some((p) => !p.accion_url && p.estatus === 'pendiente');
    const terminado = pendientes.length === 0;

    // La PC (o el teléfono) consulta el avance y la página se actualiza sola.
    useEffect(() => {
        if (terminado && !enEspera) {
            return;
        }

        const id = window.setInterval(refrescar, 5000);

        return () => window.clearInterval(id);
    }, [refrescar, terminado, enEspera]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
            <Head title={`${__('Validation')} ${estado.folio}`} />

            <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-slate-800/50 dark:bg-slate-950/80">
                <div className="min-w-0">
                    <div className="truncate text-sm font-bold tracking-wide">{empresa ?? 'Hoshō'}</div>
                    <div className="font-mono text-xs text-slate-500">{estado.folio}</div>
                </div>
                <LanguageToggle />
            </header>

            {activo && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{activo.titulo}</div>
                            <div className="font-mono text-[11px] text-slate-500">{estado.folio}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Respaldo si el navegador no da la cámara dentro del panel */}
                            <a href={activo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <ExternalLink className="h-3.5 w-3.5" />
                                {__('Camera not working?')}
                            </a>
                            <Button size="icon" variant="ghost" aria-label={__('Close')} onClick={() => {
                                setActivo(null);
                                refrescar();
                            }}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <iframe
                        key={activo.url}
                        src={activo.url}
                        title={activo.titulo}
                        className="w-full flex-1 border-0"
                        allow="camera; microphone; fullscreen; autoplay; encrypted-media"
                    />
                </div>
            )}

            <main className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_260px]">
                <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                    {terminado ? (
                        <div className="space-y-3 py-4 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                                {enEspera ? <Clock className="h-9 w-9" /> : <CheckCircle className="h-9 w-9" />}
                            </div>
                            <h1 className="text-xl font-bold">{enEspera ? __('We are reviewing your information') : __('All set!')}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {enEspera
                                    ? __('You have nothing else to do. This page updates by itself.')
                                    : __('Your validation steps are complete. Keep your folio for any follow-up.')}
                            </p>
                            <p className="font-mono text-lg font-semibold">{estado.folio}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold">{__('Complete your registration')}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {__('Finish the steps below without leaving this page.')}
                            </p>
                        </div>
                    )}

                    <ol className="space-y-3">
                        {estado.identidad.map((p) => (
                            <li key={`id-${p.id}`} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    <ScanFace className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold">{__('Identity verification')}</span>
                                            <Badge estatus={p.estatus} />
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {p.proveedor === 'didit'
                                                ? __('ID or passport from any country, plus a short selfie video.')
                                                : __('Your INE or passport, validated automatically.')}
                                        </p>
                                        {p.accion_url && (
                                            <Button className="mt-3 w-full sm:w-auto" onClick={() => setActivo({ tipo: 'didit', url: p.accion_url!, titulo: __('Identity verification') })}>
                                                {__('Verify my identity')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}

                        {estado.firmas.map((p) => (
                            <li key={`firma-${p.id}`} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold">{__('Document signature')}</span>
                                            <Badge estatus={p.estatus} />
                                        </div>
                                        <p className="mt-0.5 break-words text-xs text-slate-500">{p.nombre_documento}</p>
                                        {p.accion_url && (
                                            <Button className="mt-3 w-full sm:w-auto" onClick={() => setActivo({ tipo: 'firma', url: p.accion_url!, titulo: __('Document signature') })}>
                                                {__('Read and sign')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>

                    {estado.identidad.some((p) => p.estatus === 'rechazado') || estado.firmas.some((p) => p.estatus === 'rechazado') ? (
                        <div className="flex items-start gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            {__('Something could not be validated. The company will contact you.')}
                        </div>
                    ) : null}

                    {!terminado && (
                        <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {__('This page updates by itself.')}
                        </p>
                    )}
                </section>

                {!terminado && (
                    <aside className="hidden space-y-3 rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-xl md:block dark:border-slate-800 dark:bg-slate-900">
                        <Smartphone className="mx-auto h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <div className="text-sm font-semibold">{__('Continue on your phone')}</div>
                        <p className="text-xs text-slate-500">{__('Scan the code with your phone camera. This screen moves forward by itself when you finish.')}</p>
                        <div className="mx-auto w-44 rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr_svg }} />
                        <p className="break-all text-[10px] text-slate-400">{url}</p>
                    </aside>
                )}
            </main>
        </div>
    );
}
