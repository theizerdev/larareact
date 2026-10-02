import { Head, Link, router } from '@inertiajs/react';
import { FileSignature, Search } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';

interface Documento {
    id: number;
    folio: string | null;
    operacion_id: number | null;
    entidad_tipo: string | null;
    nombre_documento: string;
    firmante_nombre: string;
    estatus: string;
    enviado_en: string | null;
    firmado_en: string | null;
}

interface PaginatedDocumentos {
    data: Documento[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

interface PageProps {
    documentos: PaginatedDocumentos;
    filtros: { estatus?: string; q?: string };
}

const FIRMA_ESTATUS_META: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    firmado: { label: 'Signed', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rechazado: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    cancelado: { label: 'Cancelled', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    error: { label: 'Error', cls: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
};

export default function FirmaDocumentos({ documentos, filtros }: PageProps) {
    const { __ } = useTranslate();
    const [q, setQ] = useState(filtros.q || '');

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Validation Results'), href: '/admin/validaciones' },
        { title: __('Documents'), href: '/admin/validaciones/documentos' },
    ];

    const aplicar = (extra: Record<string, string | undefined>) => {
        router.get('/admin/validaciones/documentos', { ...filtros, q, ...extra }, { preserveScroll: true, preserveState: true, replace: true });
    };

    return (
        <>
            <Head title={__('Document Validations')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                        <FileSignature className="h-8 w-8 text-teal-600" />
                        {__('Document Validations')}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {__('Documents sent to electronic signature with ZapSign during registrations and pre-registrations.')}
                    </p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">{__('Signature Status')}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && aplicar({})}
                                    placeholder={__('Search by folio, document or signer...')}
                                    className="h-9 w-64"
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
                                {Object.keys(FIRMA_ESTATUS_META).map((k) => (
                                    <option key={k} value={k}>
                                        {__(FIRMA_ESTATUS_META[k].label)}
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
                                        <th className="py-2 pr-3">{__('Folio')}</th>
                                        <th className="py-2 pr-3">{__('Document')}</th>
                                        <th className="py-2 pr-3">{__('Signer')}</th>
                                        <th className="py-2 pr-3">{__('Type')}</th>
                                        <th className="py-2 pr-3">{__('Signature Status')}</th>
                                        <th className="py-2 pr-3">{__('Sent at')}</th>
                                        <th className="py-2 pr-3">{__('Signed at')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentos.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                                {__('No document has been sent to signature yet.')}
                                            </td>
                                        </tr>
                                    )}
                                    {documentos.data.map((d) => {
                                        const meta = FIRMA_ESTATUS_META[d.estatus] ?? FIRMA_ESTATUS_META.error;

                                        return (
                                            <tr key={d.id} className="border-b last:border-0">
                                                <td className="py-2 pr-3 font-mono text-xs">
                                                    {d.folio && d.operacion_id ? (
                                                        <Link href={`/admin/validaciones/operaciones/${d.operacion_id}`} className="text-teal-700 hover:underline dark:text-teal-400">
                                                            {d.folio}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="py-2 pr-3 font-medium">{d.nombre_documento}</td>
                                                <td className="py-2 pr-3">{d.firmante_nombre}</td>
                                                <td className="py-2 pr-3 text-muted-foreground">{d.entidad_tipo || '—'}</td>
                                                <td className="py-2 pr-3">
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${meta.cls}`}>
                                                        {__(meta.label)}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3 text-muted-foreground">{d.enviado_en || '—'}</td>
                                                <td className="py-2 pr-3 text-muted-foreground">{d.firmado_en || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {documentos.links && <Pagination paginatedData={documentos} filters={{ ...filtros, q }} />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
