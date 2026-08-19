import { Head, router } from '@inertiajs/react';
import { CarFront } from 'lucide-react';
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

interface IvmsPlateEvent {
    id: number;
    camera_ip: string;
    channel_name: string | null;
    event_time: string;
    plate_number: string | null;
    country_code: string | null;
    confidence: number | null;
    vehicle_type: string | null;
    vehicle_color: string | null;
    plate_color: string | null;
    list_type: string | null;
    brand_code: string | null;
    direction: string | null;
    photo_count: number;
    // Datos cruzados contra el directorio de vehículos (/vehicles/directory)
    // para saber si la placa detectada corresponde a un vehículo dado de alta.
    is_registered: boolean;
    employee_no: string | null;
    registered_brand: string | null;
    registered_vehicle_type: string | null;
    registered_vehicle_color: string | null;
}

interface PageProps {
    items: Paginated<IvmsPlateEvent>;
    filters: {
        search?: string;
        plate_number?: string;
        brand_code?: string;
        camera_ip?: string;
        list_type?: string;
        direction?: string;
        is_registered?: string;
    };
    error: string | null;
}

export default function ControlAccesoEventosVehiculares({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [search, setSearch] = React.useState(filters.search || '');
    const [plateNumber, setPlateNumber] = React.useState(filters.plate_number || '');
    const [brandCode, setBrandCode] = React.useState(filters.brand_code || '');
    const [cameraIp, setCameraIp] = React.useState(filters.camera_ip || '');
    const [listType, setListType] = React.useState(filters.list_type || '');
    const [direction, setDirection] = React.useState(filters.direction || '');
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
        plate_number: plateNumber || undefined,
        brand_code: brandCode || undefined,
        camera_ip: cameraIp || undefined,
        list_type: listType || undefined,
        direction: direction || undefined,
        is_registered: isRegistered !== 'all' ? isRegistered : undefined,
    });

    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Access Control'), href: '/admin/control-acceso/eventos-vehiculares' },
        { title: __('Vehicle Access Events'), href: '/admin/control-acceso/eventos-vehiculares' },
    ];

    const columns: ColumnDef<IvmsPlateEvent>[] = [
        {
            header: 'Date/Time',
            className: 'font-medium',
            cell: (row) => new Date(row.event_time).toLocaleString(),
        },
        { header: 'Plate Number', accessorKey: 'plate_number', className: 'font-mono font-semibold' },
        {
            header: 'Confidence',
            className: 'text-center',
            hideOn: 'tablet',
            cell: (row) => (row.confidence !== null ? `${row.confidence}%` : '—'),
        },
        {
            header: 'Vehicle',
            hideOn: 'mobile',
            cell: (row) =>
                [row.registered_vehicle_color || row.vehicle_color, row.registered_vehicle_type || row.vehicle_type]
                    .filter(Boolean)
                    .join(' / ') || '—',
        },
        {
            header: 'Brand',
            hideOn: 'tablet',
            cell: (row) => row.registered_brand || row.brand_code || '—',
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
        { header: 'Camera', cell: (row) => row.channel_name || row.camera_ip, hideOn: 'tablet' },
        { header: 'List Type', accessorKey: 'list_type', hideOn: 'tablet' },
        { header: 'Direction', accessorKey: 'direction', hideOn: 'mobile' },
        {
            header: 'Photo',
            hideable: false,
            stopRowClick: true,
            cell: (row) =>
                row.photo_count > 0 ? (
                    <PhotoViewButton
                        photoIndexUrl={(i) => `/admin/control-acceso/eventos-vehiculares/${row.id}/foto/${i}`}
                        count={row.photo_count}
                        label={row.plate_number || __('Photo')}
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
    ];

    return (
        <>
            <Head title={__('Vehicle Access Events')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<CarFront className="h-6 w-6 text-white" />}
                    title={__('Vehicle Access Events')}
                    description={__('Audit log of ANPR license plate reads from the Access Control middleware (read-only).')}
                    colorClassName="bg-violet-600"
                />

                {error && <ControlAccesoErrorBanner message={error} />}

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder={__('Search by plate, camera, list type or direction')}
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
                        <FilterField label={__('Camera IP')}>
                            <Input
                                placeholder={__('e.g. 192.168.1.10')}
                                className="w-full md:w-48"
                                value={cameraIp}
                                onChange={(e) => setCameraIp(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('List Type')}>
                            <Input
                                className="w-full md:w-40"
                                value={listType}
                                onChange={(e) => setListType(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Direction')}>
                            <Input
                                className="w-full md:w-40"
                                value={direction}
                                onChange={(e) => setDirection(e.target.value)}
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
                        title: 'No vehicle access events found',
                        description: 'No plate reading events were returned by the Access Control middleware.',
                    }}
                />
            </div>
        </>
    );
}
