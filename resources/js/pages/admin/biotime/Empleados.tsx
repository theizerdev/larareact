import { Head, router } from '@inertiajs/react';
import { Fingerprint, RefreshCw, Link2, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterSync } from '@/hooks/use-filter-search';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface BiotimeEmpleado {
    id: number;
    emp_code: string;
    first_name: string | null;
    last_name: string | null;
    national: string | null;
    dept_code: string | null;
    position_code: string | null;
    mobile: string | null;
    link_status: 'auto' | 'manual' | 'unmatched';
    empleado_id: number | null;
    empleado?: { id: number; nombres: string; apellidos: string; documento_identidad: string } | null;
}

interface PageProps {
    empleados: Paginated<BiotimeEmpleado>;
    stats: { total: number; vinculados: number; sin_vincular: number };
    filters: { search?: string; link_status?: string; perPage?: string };
    empleados_shigoto: { id: number; label: string }[];
}

export default function BioTimeEmpleados({ empleados, stats, filters, empleados_shigoto }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = React.useState(filters.search || '');
    const [linkStatus, setLinkStatus] = React.useState(filters.link_status || 'all');
    const [busy, setBusy] = React.useState(false);
    const [isTableLoading, setIsTableLoading] = React.useState(false);

    React.useEffect(() => {
        const s = router.on('start', () => setIsTableLoading(true));
        const f = router.on('finish', () => setIsTableLoading(false));

        return () => {
            s();
            f();
        };
    }, []);

    const currentFilters = cleanParams({
        search: search || undefined,
        link_status: linkStatus !== 'all' ? linkStatus : undefined,
        perPage: filters.perPage,
    });
    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Employees'), href: '/admin/biotime/empleados' },
    ];

    const linkTo = (row: BiotimeEmpleado, empleadoId: string) => {
        router.put(
            `/admin/biotime/empleados/${row.id}/vincular`,
            { empleado_id: empleadoId === 'none' ? null : Number(empleadoId) },
            { preserveScroll: true, preserveState: true },
        );
    };

    const autoLink = () => {
        setBusy(true);
        router.post('/admin/biotime/empleados/auto-vincular', {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const sync = () => {
        setBusy(true);
        router.post('/admin/biotime/sync', { only: 'employees' }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const columns: ColumnDef<BiotimeEmpleado>[] = [
        { header: __('Code'), accessorKey: 'emp_code', className: 'font-mono font-semibold' },
        {
            header: __('Name'),
            cell: (r) => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—',
        },
        { header: __('National ID'), accessorKey: 'national', className: 'font-mono text-xs', hideOn: 'mobile' },
        { header: __('Dept.'), accessorKey: 'dept_code', hideOn: 'mobile' },
        {
            header: __('Link status'),
            cell: (r) => <LinkBadge status={r.link_status} />,
        },
        {
            header: __('Shigoto employee'),
            cell: (r) => (
                <Select value={r.empleado_id ? String(r.empleado_id) : 'none'} onValueChange={(v) => linkTo(r, v)}>
                    <SelectTrigger className="h-8 w-[240px] text-xs">
                        <SelectValue placeholder={__('Not linked')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{__('Not linked')}</SelectItem>
                        {empleados_shigoto.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                                {e.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
    ];

    return (
        <>
            <Head title={__('BioTime Employees')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Fingerprint className="h-6 w-6 text-white" />}
                    title={__('BioTime Employees')}
                    description={__('Employees mirrored from BioTime and their link to Shigoto employees.')}
                    colorClassName="bg-rose-600"
                >
                    <div className="flex gap-2">
                        <Button onClick={autoLink} disabled={busy} variant="secondary" className="gap-2">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            {__('Auto-link')}
                        </Button>
                        <Button onClick={sync} disabled={busy} variant="secondary" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            {__('Sync now')}
                        </Button>
                    </div>
                </ModuleHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard icon={<Users className="h-5 w-5 text-white" />} title={__('Total')} value={stats.total} colorClassName="bg-rose-500" />
                    <StatCard icon={<UserCheck className="h-5 w-5 text-white" />} title={__('Linked')} value={stats.vinculados} colorClassName="bg-emerald-500" />
                    <StatCard icon={<UserX className="h-5 w-5 text-white" />} title={__('Unlinked')} value={stats.sin_vincular} colorClassName="bg-amber-500" />
                </div>

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Code, name or national ID')}
                                className="w-full md:w-80"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Link status')}>
                            <Select value={linkStatus} onValueChange={setLinkStatus}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="auto">{__('Auto')}</SelectItem>
                                    <SelectItem value="manual">{__('Manual')}</SelectItem>
                                    <SelectItem value="unmatched">{__('Unlinked')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    data={empleados}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: __('No employees yet'),
                        description: __('Run a sync to pull employees from BioTime.'),
                    }}
                />
            </div>
        </>
    );
}

function LinkBadge({ status }: { status: 'auto' | 'manual' | 'unmatched' }) {
    const { __ } = useTranslate();
    const map = {
        auto: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        manual: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        unmatched: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
    } as const;
    const label = { auto: __('Auto'), manual: __('Manual'), unmatched: __('Unlinked') }[status];

    return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[status]}`}>{label}</span>;
}
