import { Head, router } from '@inertiajs/react';
import { ClipboardList, FileText, Loader2, RefreshCw, Users } from 'lucide-react';
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

interface Permiso {
    id: number;
    biotime_id: string;
    emp_code: string | null;
    first_name: string | null;
    last_name: string | null;
    dept_name: string | null;
    category: string | null;
    start_time: string | null;
    end_time: string | null;
    apply_reason: string | null;
    audit_status: string | null;
    audit_reason: string | null;
    last_approver: string | null;
}

interface PageProps {
    permisos: Paginated<Permiso>;
    stats: { total: number; empleados: number };
    filters: { search?: string; category?: string; audit_status?: string; fecha_inicio?: string; fecha_fin?: string; perPage?: string };
    categorias: string[];
    estatus: string[];
    biotime_active: boolean;
}

export default function BioTimePermisos({ permisos, stats, filters, categorias, estatus, biotime_active }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = React.useState(filters.search || '');
    const [category, setCategory] = React.useState(filters.category || 'all');
    const [auditStatus, setAuditStatus] = React.useState(filters.audit_status || 'all');
    const [fechaInicio, setFechaInicio] = React.useState(filters.fecha_inicio || '');
    const [fechaFin, setFechaFin] = React.useState(filters.fecha_fin || '');
    const [syncing, setSyncing] = React.useState(false);
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
        category: category !== 'all' ? category : undefined,
        audit_status: auditStatus !== 'all' ? auditStatus : undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        perPage: filters.perPage,
    });
    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Leaves'), href: '/admin/biotime/permisos' },
    ];

    const sync = () => {
        setSyncing(true);
        router.post('/admin/biotime/sync', { only: 'attendance' }, { preserveScroll: true, onFinish: () => setSyncing(false) });
    };

    const columns: ColumnDef<Permiso>[] = [
        {
            header: __('Employee'),
            cell: (r) => {
                const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();

                return name ? `${name} (${r.emp_code ?? '—'})` : (r.emp_code ?? '—');
            },
        },
        { header: __('Type'), cell: (r) => r.category || '—' },
        {
            header: __('From'),
            cell: (r) => (r.start_time ? new Date(r.start_time).toLocaleString() : '—'),
            className: 'whitespace-nowrap',
        },
        {
            header: __('To'),
            cell: (r) => (r.end_time ? new Date(r.end_time).toLocaleString() : '—'),
            className: 'whitespace-nowrap',
            hideOn: 'mobile',
        },
        { header: __('Status'), cell: (r) => r.audit_status || '—' },
        { header: __('Reason'), cell: (r) => r.apply_reason || '—', hideOn: 'tablet' },
        { header: __('Department'), cell: (r) => r.dept_name || '—', hideOn: 'tablet' },
    ];

    return (
        <>
            <Head title={__('BioTime Leaves')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ClipboardList className="h-6 w-6 text-white" />}
                    title={__('BioTime Leaves')}
                    description={__('Leaves and incidents mirrored from BioTime. They do not justify absences in the LFT attendance module.')}
                    colorClassName="bg-rose-600"
                >
                    <Button onClick={sync} disabled={syncing || !biotime_active} variant="secondary" className="gap-2">
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {__('Sync now')}
                    </Button>
                </ModuleHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                    <StatCard icon={<FileText className="h-5 w-5 text-white" />} title={__('Total')} value={stats.total} colorClassName="bg-rose-500" />
                    <StatCard icon={<Users className="h-5 w-5 text-white" />} title={__('Employees')} value={stats.empleados} colorClassName="bg-sky-500" />
                </div>

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Employee code or name')}
                                className="w-full md:w-64"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Type')}>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    {categorias.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Status')}>
                            <Select value={auditStatus} onValueChange={setAuditStatus}>
                                <SelectTrigger className="w-full md:w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    {estatus.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('From')}>
                            <Input type="date" className="w-full md:w-40" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                        </FilterField>
                        <FilterField label={__('To')}>
                            <Input type="date" className="w-full md:w-40" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    data={permisos}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: __('No leaves found'),
                        description: __('Adjust the filters or run a sync to pull leaves from BioTime.'),
                    }}
                />
            </div>
        </>
    );
}
