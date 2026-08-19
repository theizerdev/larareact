import { Head, router } from '@inertiajs/react';
import { Car } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ControlAccesoErrorBanner } from '@/components/control-acceso/error-banner';
import { PhotoViewButton } from '@/components/control-acceso/photo-view-button';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterSync } from '@/hooks/use-filter-search';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

// Entrada del directorio automático de vehículos (/vehicles/directory): combina
// detecciones ANPR de cámaras con los datos de alta manual cuando el vehículo
// también está registrado (is_registered).
interface IvmsVehicleDirectoryEntry {
    plate_number: string;
    last_seen_at: string | null;
    last_seen_camera_ip: string | null;
    plate_event_id: number | null;
    photo_count: number;
    detected_vehicle_type: string | null;
    detected_vehicle_color: string | null;
    detected_brand_code: string | null;
    detected_confidence: number | null;
    is_registered: boolean;
    employee_no: string | null;
    vehicle_type: string | null;
    vehicle_color: string | null;
    brand: string | null;
}

interface PageProps {
    items: Paginated<IvmsVehicleDirectoryEntry>;
    filters: {
        search?: string;
        employee_no?: string;
        plate_number?: string;
        brand_code?: string;
        is_registered?: string;
    };
    error: string | null;
}

export default function ControlAccesoVehiculos({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [search, setSearch] = React.useState(filters.search || '');
    const [employeeNo, setEmployeeNo] = React.useState(filters.employee_no || '');
    const [plateNumber, setPlateNumber] = React.useState(filters.plate_number || '');
    const [brandCode, setBrandCode] = React.useState(filters.brand_code || '');
    const [isRegistered, setIsRegistered] = React.useState(filters.is_registered ?? 'all');
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
        plate_number: plateNumber || undefined,
        brand_code: brandCode || undefined,
        is_registered: isRegistered !== 'all' ? isRegistered : undefined,
    });

    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/vehiculos' },
        { title: __('Vehicles'), href: '/admin/control-acceso/vehiculos' },
    ];

    const columns: ColumnDef<IvmsVehicleDirectoryEntry>[] = [
        { header: 'Plate Number', accessorKey: 'plate_number', className: 'font-mono font-semibold' },
        {
            header: 'Last Seen',
            cell: (row) => (row.last_seen_at ? new Date(row.last_seen_at).toLocaleString() : '—'),
        },
        { header: 'Camera', accessorKey: 'last_seen_camera_ip', className: 'font-mono text-xs', hideOn: 'tablet' },
        { header: 'Type', cell: (row) => row.vehicle_type || row.detected_vehicle_type || '—', hideOn: 'mobile' },
        { header: 'Color', cell: (row) => row.vehicle_color || row.detected_vehicle_color || '—', hideOn: 'mobile' },
        { header: 'Brand', cell: (row) => row.brand || row.detected_brand_code || '—', hideOn: 'tablet' },
        {
            header: 'Confidence',
            className: 'text-center',
            hideOn: 'tablet',
            cell: (row) => (row.detected_confidence !== null ? `${row.detected_confidence}%` : '—'),
        },
        {
            header: 'Registered',
            cell: (row) => (
                <span
                    className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full border',
                        row.is_registered
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                    )}
                >
                    {row.is_registered ? __('Yes') : __('No')}
                </span>
            ),
        },
        { header: 'Employee No.', cell: (row) => row.employee_no || '—', className: 'font-mono text-xs', hideOn: 'tablet' },
        {
            header: 'Photo',
            hideable: false,
            stopRowClick: true,
            cell: (row) =>
                row.photo_count > 0 && row.plate_event_id ? (
                    <PhotoViewButton
                        photoIndexUrl={(i) => `/admin/control-acceso/eventos-vehiculares/${row.plate_event_id}/foto/${i}`}
                        count={row.photo_count}
                        label={row.plate_number}
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
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
                    description={__('Vehicle directory detected by ANPR cameras and registered vehicles from the Access Control middleware (read-only).')}
                    colorClassName="bg-violet-600"
                />

                {error && <ControlAccesoErrorBanner message={error} />}

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by plate, brand or employee number')}
                                className="w-full md:w-80"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Plate Number')}>
                            <Input
                                placeholder={__('Search by plate')}
                                className="w-full md:w-40"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Brand')}>
                            <Input
                                className="w-full md:w-32"
                                value={brandCode}
                                onChange={(e) => setBrandCode(e.target.value)}
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
                        <FilterField label={__('Registered')}>
                            <Select value={isRegistered} onValueChange={setIsRegistered}>
                                <SelectTrigger className="w-full md:w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="true">{__('Yes')}</SelectItem>
                                    <SelectItem value="false">{__('No')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
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
