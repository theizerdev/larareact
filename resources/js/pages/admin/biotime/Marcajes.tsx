import { Head, router } from '@inertiajs/react';
import { Fingerprint, RefreshCw, LogIn, LogOut, Clock, Loader2 } from 'lucide-react';
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

interface BiotimeMarcaje {
    id: number;
    biotime_id: number;
    emp_code: string;
    punch_time: string;
    punch_state: string | null;
    punch_state_label: string | null;
    verify_type_label: string | null;
    dispositivo_alias: string | null;
    dispositivo_sn: string | null;
    area_alias: string | null;
    temperature: string | null;
    biotime_empleado?: { id: number; emp_code: string; first_name: string | null; last_name: string | null } | null;
}

interface PageProps {
    marcajes: Paginated<BiotimeMarcaje>;
    stats: { total: number; entradas: number; salidas: number; otros: number };
    filters: { search?: string; dispositivo?: string; punch_state?: string; fecha_inicio?: string; fecha_fin?: string; perPage?: string };
    dispositivos: { sn: string; alias: string | null }[];
    punch_states: Record<string, string>;
}

export default function BioTimeMarcajes({ marcajes, stats, filters, dispositivos, punch_states }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = React.useState(filters.search || '');
    const [dispositivo, setDispositivo] = React.useState(filters.dispositivo || 'all');
    const [punchState, setPunchState] = React.useState(filters.punch_state || 'all');
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
        dispositivo: dispositivo !== 'all' ? dispositivo : undefined,
        punch_state: punchState !== 'all' ? punchState : undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        perPage: filters.perPage,
    });
    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Punches'), href: '/admin/biotime/marcajes' },
    ];

    const sync = () => {
        setSyncing(true);
        router.post('/admin/biotime/sync', { only: 'transactions' }, { preserveScroll: true, onFinish: () => setSyncing(false) });
    };

    const columns: ColumnDef<BiotimeMarcaje>[] = [
        {
            header: __('Date / time'),
            cell: (r) => new Date(r.punch_time).toLocaleString(),
            className: 'whitespace-nowrap',
        },
        {
            header: __('Employee'),
            cell: (r) => {
                const be = r.biotime_empleado;
                const name = be ? `${be.first_name ?? ''} ${be.last_name ?? ''}`.trim() : '';

                return name ? `${name} (${r.emp_code})` : r.emp_code;
            },
        },
        {
            header: __('Type'),
            cell: (r) => r.punch_state_label || r.punch_state || '—',
        },
        { header: __('Verification'), accessorKey: 'verify_type_label', hideOn: 'mobile' },
        {
            header: __('Device'),
            cell: (r) => r.dispositivo_alias || r.dispositivo_sn || '—',
            hideOn: 'mobile',
        },
        { header: __('Area'), accessorKey: 'area_alias', hideOn: 'tablet' },
    ];

    return (
        <>
            <Head title={__('BioTime Punches')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Fingerprint className="h-6 w-6 text-white" />}
                    title={__('BioTime Punches')}
                    description={__('Clock punches mirrored from BioTime. Separate from the LFT attendance module.')}
                    colorClassName="bg-rose-600"
                >
                    <Button onClick={sync} disabled={syncing} variant="secondary" className="gap-2">
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {__('Sync now')}
                    </Button>
                </ModuleHeader>

                <div className="grid gap-3 sm:grid-cols-4">
                    <StatCard icon={<Clock className="h-5 w-5 text-white" />} title={__('Total')} value={stats.total} colorClassName="bg-rose-500" />
                    <StatCard icon={<LogIn className="h-5 w-5 text-white" />} title={__('Check-ins')} value={stats.entradas} colorClassName="bg-emerald-500" />
                    <StatCard icon={<LogOut className="h-5 w-5 text-white" />} title={__('Check-outs')} value={stats.salidas} colorClassName="bg-sky-500" />
                    <StatCard icon={<Clock className="h-5 w-5 text-white" />} title={__('Other')} value={stats.otros} colorClassName="bg-amber-500" />
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
                        <FilterField label={__('Device')}>
                            <Select value={dispositivo} onValueChange={setDispositivo}>
                                <SelectTrigger className="w-full md:w-52">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    {dispositivos.map((d) => (
                                        <SelectItem key={d.sn} value={d.sn}>
                                            {d.alias || d.sn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Type')}>
                            <Select value={punchState} onValueChange={setPunchState}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    {Object.entries(punch_states).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>
                                            {v}
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
                    data={marcajes}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: __('No punches found'),
                        description: __('Adjust the filters or run a sync to pull punches from BioTime.'),
                    }}
                />
            </div>
        </>
    );
}
