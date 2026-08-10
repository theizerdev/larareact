import { Head, router } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ControlAccesoErrorBanner } from '@/components/control-acceso/error-banner';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFilterSync } from '@/hooks/use-filter-search';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface IvmsAccessCard {
    card_no: string;
    employee_no: string;
    card_type: string | null;
    is_leader_card: boolean;
    created_at: string | null;
}

interface PageProps {
    items: Paginated<IvmsAccessCard>;
    filters: {
        search?: string;
        employee_no?: string;
        card_no?: string;
        include_deleted?: string;
    };
    error: string | null;
}

export default function ControlAccesoTarjetas({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [search, setSearch] = React.useState(filters.search || '');
    const [employeeNo, setEmployeeNo] = React.useState(filters.employee_no || '');
    const [cardNo, setCardNo] = React.useState(filters.card_no || '');
    const [includeDeleted, setIncludeDeleted] = React.useState(
        filters.include_deleted === '1' || filters.include_deleted === 'true'
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
        search: search || undefined,
        employee_no: employeeNo || undefined,
        card_no: cardNo || undefined,
        include_deleted: includeDeleted ? '1' : undefined,
    });

    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/tarjetas' },
        { title: __('Access Cards'), href: '/admin/control-acceso/tarjetas' },
    ];

    const columns: ColumnDef<IvmsAccessCard>[] = [
        { header: 'Card No.', accessorKey: 'card_no', className: 'font-mono font-semibold' },
        { header: 'Employee No.', accessorKey: 'employee_no', className: 'font-mono text-xs' },
        { header: 'Card Type', accessorKey: 'card_type', hideOn: 'mobile' },
        {
            header: 'Leader Card',
            cell: (row) =>
                row.is_leader_card ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900">
                        {__('Yes')}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">{__('No')}</span>
                ),
        },
        {
            header: 'Created',
            hideOn: 'mobile',
            cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
        },
    ];

    return (
        <>
            <Head title={__('Access Cards')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<CreditCard className="h-6 w-6 text-white" />}
                    title={__('Access Cards')}
                    description={__('Access cards registered in the Access Control middleware (read-only).')}
                    colorClassName="bg-violet-600"
                />

                {error && <ControlAccesoErrorBanner message={error} />}

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by card or employee number')}
                                className="w-full md:w-80"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Card No.')}>
                            <Input
                                className="w-full md:w-48"
                                value={cardNo}
                                onChange={(e) => setCardNo(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Employee No.')}>
                            <Input
                                placeholder={__('Exact employee number')}
                                className="w-full md:w-48"
                                value={employeeNo}
                                onChange={(e) => setEmployeeNo(e.target.value)}
                            />
                        </FilterField>
                    </div>
                    <FilterField label={__('Include Deleted')}>
                        <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
                    </FilterField>
                </FilterBar>

                <DataTable
                    data={items}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: 'No access cards found',
                        description: 'No access cards were returned by the Access Control middleware.',
                    }}
                />
            </div>
        </>
    );
}
