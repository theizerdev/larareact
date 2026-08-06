import { Head, router } from '@inertiajs/react';
import { Fingerprint } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ControlAccesoErrorBanner } from '@/components/control-acceso/error-banner';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface IvmsEmployee {
    employee_no: string;
    full_name: string;
    email: string | null;
    gender: string | null;
    user_type: string | null;
    valid_from: string | null;
    valid_to: string | null;
    valid_enabled: boolean | null;
    num_cards: number;
    num_faces: number;
    is_system_account: boolean;
    created_at: string | null;
}

interface PageProps {
    items: Paginated<IvmsEmployee>;
    filters: {
        include_system_accounts?: string;
        include_deleted?: string;
    };
    error: string | null;
}

export default function ControlAccesoEmpleados({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [includeSystemAccounts, setIncludeSystemAccounts] = React.useState(
        filters.include_system_accounts === '1' || filters.include_system_accounts === 'true'
    );
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
        include_system_accounts: includeSystemAccounts ? '1' : undefined,
        include_deleted: includeDeleted ? '1' : undefined,
    });

    React.useEffect(() => {
        router.get(window.location.pathname, currentFilters, { preserveState: true, preserveScroll: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeSystemAccounts, includeDeleted]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/empleados' },
        { title: __('IVMS Employees'), href: '/admin/control-acceso/empleados' },
    ];

    const columns: ColumnDef<IvmsEmployee>[] = [
        { header: 'Employee No.', accessorKey: 'employee_no', className: 'font-mono text-xs' },
        { header: 'Full Name', accessorKey: 'full_name', className: 'font-medium' },
        { header: 'Email', accessorKey: 'email', hideOn: 'mobile' },
        { header: 'User Type', accessorKey: 'user_type', hideOn: 'tablet' },
        {
            header: 'Validity',
            cell: (row) => (
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        row.valid_enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}
                >
                    {row.valid_enabled ? __('Active') : __('Inactive')}
                </span>
            ),
        },
        { header: 'Cards', accessorKey: 'num_cards', className: 'text-center', hideOn: 'tablet' },
        { header: 'Faces', accessorKey: 'num_faces', className: 'text-center', hideOn: 'tablet' },
        {
            header: 'Created',
            hideOn: 'mobile',
            cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
        },
    ];

    return (
        <>
            <Head title={__('IVMS Employees')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Fingerprint className="h-6 w-6 text-white" />}
                    title={__('IVMS Employees')}
                    description={__('Employees registered in the Access Control middleware (read-only).')}
                    colorClassName="bg-violet-600"
                />

                {error && <ControlAccesoErrorBanner message={error} />}

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-6">
                        <FilterField label={__('Include System Accounts')}>
                            <Switch checked={includeSystemAccounts} onCheckedChange={setIncludeSystemAccounts} />
                        </FilterField>
                        <FilterField label={__('Include Deleted')}>
                            <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    data={items}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    emptyState={{
                        title: 'No employees found',
                        description: 'No employees were returned by the Access Control middleware.',
                    }}
                />
            </div>
        </>
    );
}
