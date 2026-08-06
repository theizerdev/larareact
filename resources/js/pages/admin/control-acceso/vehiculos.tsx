import { Head, router } from '@inertiajs/react';
import { Car } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ControlAccesoErrorBanner } from '@/components/control-acceso/error-banner';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface IvmsVehicle {
    plate_number: string;
    employee_no: string;
    vehicle_type: string | null;
    vehicle_color: string | null;
    brand: string | null;
    created_at: string | null;
}

interface PageProps {
    items: Paginated<IvmsVehicle>;
    filters: {
        employee_no?: string;
        include_deleted?: string;
    };
    error: string | null;
}

export default function ControlAccesoVehiculos({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [employeeNo, setEmployeeNo] = React.useState(filters.employee_no || '');
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
        employee_no: employeeNo || undefined,
        include_deleted: includeDeleted ? '1' : undefined,
    });

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, currentFilters, { preserveState: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeNo, includeDeleted]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/vehiculos' },
        { title: __('Vehicles'), href: '/admin/control-acceso/vehiculos' },
    ];

    const columns: ColumnDef<IvmsVehicle>[] = [
        { header: 'Plate Number', accessorKey: 'plate_number', className: 'font-mono font-semibold' },
        { header: 'Employee No.', accessorKey: 'employee_no', className: 'font-mono text-xs' },
        { header: 'Type', accessorKey: 'vehicle_type', hideOn: 'mobile' },
        { header: 'Color', accessorKey: 'vehicle_color', hideOn: 'mobile' },
        { header: 'Brand', accessorKey: 'brand', hideOn: 'tablet' },
        {
            header: 'Created',
            hideOn: 'mobile',
            cell: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '—'),
        },
    ];

    return (
        <>
            <Head title={__('Vehicles')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Car className="h-6 w-6 text-white" />}
                    title={__('Vehicles')}
                    description={__('Vehicles registered in the Access Control middleware (read-only).')}
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
                        title: 'No vehicles found',
                        description: 'No vehicles were returned by the Access Control middleware.',
                    }}
                />
            </div>
        </>
    );
}
