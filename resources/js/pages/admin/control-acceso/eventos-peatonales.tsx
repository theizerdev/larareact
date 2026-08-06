import { Head, router } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ControlAccesoErrorBanner } from '@/components/control-acceso/error-banner';
import { PhotoViewButton } from '@/components/control-acceso/photo-view-button';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface IvmsAccessEvent {
    id: number;
    terminal_ip: string;
    event_time: string;
    employee_no: string | null;
    person_name: string | null;
    card_no: string | null;
    major_code: number;
    minor_code: number;
    door_no: number | null;
    verify_mode: string | null;
    is_identity_match: boolean;
    photo_url: string | null;
}

interface PageProps {
    items: Paginated<IvmsAccessEvent>;
    filters: {
        employee_no?: string;
        include_system_events?: string;
        only_identity_matches?: string;
    };
    error: string | null;
}

export default function ControlAccesoEventosPeatonales({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [employeeNo, setEmployeeNo] = React.useState(filters.employee_no || '');
    const [includeSystemEvents, setIncludeSystemEvents] = React.useState(
        filters.include_system_events === '1' || filters.include_system_events === 'true'
    );
    const [onlyIdentityMatches, setOnlyIdentityMatches] = React.useState(
        filters.only_identity_matches === '1' || filters.only_identity_matches === 'true'
    );
    const [isTableLoading, setIsTableLoading] = React.useState(false);

    React.useEffect(() => {
        const unbindStart = router.on('start', () => setIsTableLoading(true));
        const unbindFinish = router.on('finish', () => setIsTableLoading(false));

        return () => {
            unbindStart();
            unbindFinish();
        };
    }, []);

    const currentFilters = cleanParams({
        employee_no: employeeNo || undefined,
        include_system_events: includeSystemEvents ? '1' : undefined,
        only_identity_matches: onlyIdentityMatches ? '1' : undefined,
    });

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, currentFilters, { preserveState: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeNo, includeSystemEvents, onlyIdentityMatches]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/eventos-peatonales' },
        { title: __('Pedestrian Access Events'), href: '/admin/control-acceso/eventos-peatonales' },
    ];

    const columns: ColumnDef<IvmsAccessEvent>[] = [
        {
            header: 'Date/Time',
            className: 'font-medium',
            cell: (row) => new Date(row.event_time).toLocaleString(),
        },
        { header: 'Person', cell: (row) => row.person_name || row.employee_no || '—' },
        { header: 'Card No.', accessorKey: 'card_no', className: 'font-mono text-xs', hideOn: 'mobile' },
        { header: 'Terminal', accessorKey: 'terminal_ip', className: 'font-mono text-xs', hideOn: 'tablet' },
        { header: 'Door', accessorKey: 'door_no', className: 'text-center', hideOn: 'tablet' },
        { header: 'Verify Mode', accessorKey: 'verify_mode', hideOn: 'tablet' },
        {
            header: 'Identity Match',
            cell: (row) => (
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        row.is_identity_match
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                    )}
                >
                    {row.is_identity_match ? __('Yes') : __('No')}
                </span>
            ),
        },
        {
            header: 'Photo',
            hideable: false,
            stopRowClick: true,
            cell: (row) =>
                row.photo_url ? (
                    <PhotoViewButton
                        src={`/admin/control-acceso/eventos-peatonales/${row.id}/foto`}
                        label={row.person_name || row.employee_no || __('Photo')}
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
    ];

    return (
        <>
            <Head title={__('Pedestrian Access Events')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ScanFace className="h-6 w-6 text-white" />}
                    title={__('Pedestrian Access Events')}
                    description={__('Audit log of pedestrian access events from the Access Control middleware (read-only).')}
                    colorClassName="bg-violet-600"
                />

                {error && <ControlAccesoErrorBanner message={error} />}

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Employee No.')}>
                            <Input
                                placeholder={__('Exact employee number')}
                                className="w-full md:w-56"
                                value={employeeNo}
                                onChange={(e) => setEmployeeNo(e.target.value)}
                            />
                        </FilterField>
                    </div>
                    <div className="flex flex-wrap items-end gap-6">
                        <FilterField label={__('Include System Events')}>
                            <Switch checked={includeSystemEvents} onCheckedChange={setIncludeSystemEvents} />
                        </FilterField>
                        <FilterField label={__('Only Identity Matches')}>
                            <Switch checked={onlyIdentityMatches} onCheckedChange={setOnlyIdentityMatches} />
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    data={items}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: 'No access events found',
                        description: 'No pedestrian access events were returned by the Access Control middleware.',
                    }}
                />
            </div>
        </>
    );
}
