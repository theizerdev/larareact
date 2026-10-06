import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Download, FileSignature, FolderOpen, RefreshCw, ShieldCheck, Smartphone, UserPlus, XCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';

interface Operacion {
    id: number;
    folio: string;
    tipo_operacion: string;
    origen: string;
    estatus: string;
    entidad_tipo: string | null;
    entidad_nombre: string | null;
    sucursal: string | null;
    iniciado_por: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface Kyc {
    id: number;
    persona_nombre: string;
    persona_tipo: string;
    proveedor: 'jaak' | 'didit';
    tipo_documento: string | null;
    pais_documento: string | null;
    estatus: string;
    score_global: number | null;
    created_at: string | null;
    procesado_en: string | null;
}

interface Documento {
    id: number;
    nombre_documento: string;
    firmante_nombre: string;
    estatus: string;
    enviado_en: string | null;
    firmado_en: string | null;
    rechazado_en: string | null;
    tiene_pdf: boolean;
    error_detalle: string | null;
}

interface PageProps {
    operacion: Operacion;
    kycs: Kyc[];
    documentos: Documento[];
    seguimiento_url: string | null;
    seguimiento_qr: string | null;
    puede_gestionar: boolean;
}

const OPERACION_ESTATUS_META: Record<string, { label: string; cls: string }> = {
    en_curso: { label: 'In progress', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    completo: { label: 'Complete', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    con_observaciones: { label: 'With observations', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
};

const KYC_ESTATUS_META: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    procesando: { label: 'Processing', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    aprobado: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    revision: { label: 'Under review', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    error: { label: 'Error', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
};

const FIRMA_ESTATUS_META: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    firmado: { label: 'Signed', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    cancelado: { label: 'Cancelled', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    error: { label: 'Error', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
};

const TIPO_LABEL: Record<string, string> = {
    alta: 'Registration',
    prerregistro: 'Pre-registration',
    revalidacion: 'Re-validation',
};

const ORIGEN_LABEL: Record<string, string> = {
    panel: 'Admin panel',
    prerregistro: 'Pre-registration link',
    telefono: 'Phone',
};

function Badge({ meta }: { meta: { label: string; cls: string } }) {
    const { __ } = useTranslate();

    return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>{__(meta.label)}</span>;
}

const PROVEEDOR_LABEL: Record<string, string> = { jaak: 'JAAK', didit: 'DIDIT' };

export default function OperacionValidacion({ operacion, kycs, documentos, seguimiento_url, seguimiento_qr, puede_gestionar }: PageProps) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Validation Results'), href: '/admin/validaciones' },
        { title: operacion.folio, href: `/admin/validaciones/operaciones/${operacion.id}` },
    ];

    const datos: [string, string | null][] = [
        [__('Operation type'), __(TIPO_LABEL[operacion.tipo_operacion] ?? operacion.tipo_operacion)],
        [__('Origin'), __(ORIGEN_LABEL[operacion.origen] ?? operacion.origen)],
        [__('Type'), operacion.entidad_tipo],
        [__('Name'), operacion.entidad_nombre],
        [__('Branch'), operacion.sucursal],
        [__('Started by'), operacion.iniciado_por],
        [__('Opened at'), operacion.created_at],
        [__('Last update'), operacion.updated_at],
    ];

    return (
        <>
            <Head title={`${__('Operation')} ${operacion.folio}`} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                            <FolderOpen className="h-8 w-8 text-teal-600" />
                            <span className="font-mono">{operacion.folio}</span>
                        </h1>
                        <div className="mt-2">
                            <Badge meta={OPERACION_ESTATUS_META[operacion.estatus] ?? OPERACION_ESTATUS_META.en_curso} />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        {__('Back')}
                    </Button>
                </div>

                {seguimiento_url && (
                    <Card className="shadow-sm border-indigo-200 dark:border-indigo-900">
                        <CardContent className="flex flex-col items-center gap-5 pt-6 sm:flex-row">
                            {seguimiento_qr && (
                                <div className="w-40 shrink-0 rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: seguimiento_qr }} />
                            )}
                            <div className="min-w-0 space-y-2">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Smartphone className="h-5 w-5 text-indigo-600" />
                                    {__('The person still has steps to complete')}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {__('Have them scan the code with their phone to verify their identity and sign. This page shows the result when they finish.')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">{seguimiento_url}</code>
                                    <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => navigator.clipboard?.writeText(seguimiento_url)}>
                                        <Copy className="h-3.5 w-3.5" />
                                        {__('Copy link')}
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => router.reload({ only: ['operacion', 'kycs', 'documentos', 'seguimiento_url', 'seguimiento_qr'] })}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        {__('Refresh')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">{__('Operation')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            {datos.map(([label, valor]) => (
                                <div key={label}>
                                    <dt className="text-xs text-muted-foreground">{label}</dt>
                                    <dd className="font-medium">{valor || '—'}</dd>
                                </div>
                            ))}
                        </dl>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">{__('Timeline')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="relative space-y-5 border-l border-border pl-6">
                            <li>
                                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950">
                                    <UserPlus className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                                </span>
                                <div className="text-sm font-medium">{__(TIPO_LABEL[operacion.tipo_operacion] ?? operacion.tipo_operacion)}</div>
                                <div className="text-xs text-muted-foreground">{operacion.created_at}</div>
                            </li>

                            {kycs.map((k) => (
                                <li key={`kyc-${k.id}`}>
                                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950">
                                        <ShieldCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {__('Identity')} · {k.persona_nombre}
                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                                            {PROVEEDOR_LABEL[k.proveedor] ?? k.proveedor}
                                            {k.tipo_documento ? ` · ${k.tipo_documento === 'pasaporte' ? __('Passport') : k.tipo_documento.toUpperCase()}` : ''}
                                            {k.pais_documento ? ` · ${k.pais_documento}` : ''}
                                        </span>
                                        <Badge meta={KYC_ESTATUS_META[k.estatus] ?? KYC_ESTATUS_META.error} />
                                        {k.score_global !== null && <span className="text-xs text-muted-foreground">{k.score_global}%</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {k.procesado_en || k.created_at} ·{' '}
                                        <Link href={`/admin/validaciones?q=${encodeURIComponent(operacion.folio)}`} className="text-teal-700 hover:underline dark:text-teal-400">
                                            {__('View detail')}
                                        </Link>
                                    </div>
                                </li>
                            ))}

                            {documentos.map((d) => (
                                <li key={`doc-${d.id}`}>
                                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950">
                                        <FileSignature className="h-3.5 w-3.5 text-teal-700 dark:text-teal-300" />
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {d.nombre_documento} · {d.firmante_nombre}
                                        <Badge meta={FIRMA_ESTATUS_META[d.estatus] ?? FIRMA_ESTATUS_META.error} />
                                    </div>
                                    <div className="text-xs text-muted-foreground">{d.firmado_en || d.rechazado_en || d.enviado_en || '—'}</div>
                                    {d.error_detalle && <div className="text-xs text-rose-600">{d.error_detalle}</div>}
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {d.tiene_pdf && (
                                            <a href={`/admin/validaciones/documentos/${d.id}/pdf`} className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline dark:text-teal-400">
                                                <Download className="h-3 w-3" />
                                                {__('Signed PDF')}
                                            </a>
                                        )}
                                        {puede_gestionar && d.estatus === 'pendiente' && (
                                            <>
                                                <button type="button" className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline dark:text-teal-400" onClick={() => router.post(`/admin/validaciones/documentos/${d.id}/consultar`, {}, { preserveScroll: true })}>
                                                    <RefreshCw className="h-3 w-3" />
                                                    {__('Check status')}
                                                </button>
                                                <button type="button" className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline" onClick={() => confirm(__('Cancel this document in ZapSign?')) && router.post(`/admin/validaciones/documentos/${d.id}/cancelar`, {}, { preserveScroll: true })}>
                                                    <XCircle className="h-3 w-3" />
                                                    {__('Cancel')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}

                            {kycs.length === 0 && documentos.length === 0 && (
                                <li className="text-sm text-muted-foreground">{__('This operation has no validations yet.')}</li>
                            )}
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
