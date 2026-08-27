import { Head, router } from '@inertiajs/react';
import { ShieldCheck, RefreshCw, ChevronDown, Search } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/pagination';
import { useTranslate } from '@/hooks/use-translate';

interface Validacion {
    id: number;
    persona_nombre: string;
    persona_tipo: string;
    curp_capturada: string | null;
    estatus: string;
    curp_valida: boolean | null;
    ine_valida: boolean | null;
    rostro_coincide: boolean | null;
    en_listas: boolean | null;
    score_global: number | null;
    observaciones: string | null;
    error_detalle: string | null;
    jaak_environment: string | null;
    jaak_session_id: string | null;
    procesado_en: string | null;
    created_at: string | null;
    resultado_documento: unknown;
    resultado_ocr: unknown;
    resultado_listas: unknown;
    resultado_biometrico: unknown;
}

interface PaginatedValidaciones {
    data: Validacion[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

interface PageProps {
    validaciones: PaginatedValidaciones;
    filtros: { estatus?: string; q?: string };
    puede_revalidar: boolean;
}

const ESTATUS_META: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    procesando: { label: 'Processing', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    aprobado: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    revision: { label: 'Under review', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    error: { label: 'Error', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
};

function TriBadge({ label, value }: { label: string; value: boolean | null }) {
    const { __ } = useTranslate();
    const cls =
        value === true
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : value === false
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    const txt = value === true ? '✓' : value === false ? '✗' : '—';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
            {txt} {__(label)}
        </span>
    );
}

export default function KycValidaciones({ validaciones, filtros, puede_revalidar }: PageProps) {
    const { __ } = useTranslate();
    const [q, setQ] = useState(filtros.q || '');
    const [openId, setOpenId] = useState<number | null>(null);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('Identity Validation (KYC)'), href: '/admin/integrations/kyc' },
    ];

    const aplicar = (extra: Record<string, string | undefined>) => {
        router.get('/admin/integrations/kyc', { ...filtros, q, ...extra }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const revalidar = (id: number) => {
        router.post(
            `/admin/integrations/kyc/${id}/reprocesar`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    Swal.fire({ title: __('KYC re-validation queued.'), icon: 'success', timer: 1800, showConfirmButton: false }),
            },
        );
    };

    return (
        <>
            <Head title={__('Identity Validation (KYC)')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                        <ShieldCheck className="h-8 w-8 text-teal-600" />
                        {__('Identity Validation (KYC)')}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {__('Results of the JAAK identity checks (CURP / INE) run during pre-registration.')}
                    </p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">{__('KYC Status')}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && aplicar({})}
                                    placeholder={__('Search by CURP...')}
                                    className="h-9 w-48"
                                />
                                <Button size="sm" variant="outline" onClick={() => aplicar({})}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <select
                                value={filtros.estatus || ''}
                                onChange={(e) => aplicar({ estatus: e.target.value || undefined })}
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="">{__('All')}</option>
                                {Object.keys(ESTATUS_META).map((k) => (
                                    <option key={k} value={k}>
                                        {__(ESTATUS_META[k].label)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-2 pr-3">{__('Name')}</th>
                                        <th className="py-2 pr-3">{__('Type')}</th>
                                        <th className="py-2 pr-3">{__('KYC Status')}</th>
                                        <th className="py-2 pr-3">{__('Global score')}</th>
                                        <th className="py-2 pr-3">{__('Processed at')}</th>
                                        <th className="py-2 pr-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validaciones.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                                {__('No identity validation has been run for this person yet.')}
                                            </td>
                                        </tr>
                                    )}
                                    {validaciones.data.map((v) => {
                                        const meta = ESTATUS_META[v.estatus] ?? ESTATUS_META.error;
                                        const open = openId === v.id;
                                        return (
                                            <React.Fragment key={v.id}>
                                                <tr className="border-b last:border-0">
                                                    <td className="py-2 pr-3 font-medium">
                                                        {v.persona_nombre}
                                                        {v.curp_capturada && (
                                                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">{v.curp_capturada}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-3 text-muted-foreground">{v.persona_tipo}</td>
                                                    <td className="py-2 pr-3">
                                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>
                                                            {__(meta.label)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 pr-3">{v.score_global !== null ? `${v.score_global}%` : '—'}</td>
                                                    <td className="py-2 pr-3 text-muted-foreground">{v.procesado_en || v.created_at || '—'}</td>
                                                    <td className="py-2 pr-3 text-right">
                                                        <Button size="sm" variant="ghost" onClick={() => setOpenId(open ? null : v.id)}>
                                                            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {open && (
                                                    <tr className="bg-muted/30">
                                                        <td colSpan={6} className="p-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                <TriBadge label="CURP valid" value={v.curp_valida} />
                                                                <TriBadge label="ID document valid" value={v.ine_valida} />
                                                                <TriBadge label="Face match" value={v.rostro_coincide} />
                                                                <TriBadge
                                                                    label="On watchlists"
                                                                    value={v.en_listas === null ? null : !v.en_listas}
                                                                />
                                                            </div>
                                                            {v.observaciones && (
                                                                <div className="mt-3">
                                                                    <div className="text-xs font-semibold text-muted-foreground">{__('Notes')}</div>
                                                                    <pre className="mt-1 whitespace-pre-wrap text-xs">{v.observaciones}</pre>
                                                                </div>
                                                            )}
                                                            {v.error_detalle && (
                                                                <div className="mt-3 text-xs text-rose-600">{v.error_detalle}</div>
                                                            )}
                                                            <div className="mt-3 text-[11px] text-muted-foreground">
                                                                {__('Environment')}: {v.jaak_environment} · session: {v.jaak_session_id || '—'}
                                                            </div>
                                                            <details className="mt-3">
                                                                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                                                                    {__('JAAK raw response')}
                                                                </summary>
                                                                <pre className="mt-2 max-h-96 overflow-auto rounded bg-background p-3 text-[11px]">
                                                                    {JSON.stringify(
                                                                        {
                                                                            documento: v.resultado_documento,
                                                                            ocr: v.resultado_ocr,
                                                                            listas: v.resultado_listas,
                                                                            biometrico: v.resultado_biometrico,
                                                                        },
                                                                        null,
                                                                        2,
                                                                    )}
                                                                </pre>
                                                            </details>
                                                            {puede_revalidar && (
                                                                <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={() => revalidar(v.id)}>
                                                                    <RefreshCw className="h-4 w-4" />
                                                                    {__('Re-run KYC')}
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {validaciones.links && <Pagination paginatedData={validaciones} filters={{ ...filtros, q }} />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
