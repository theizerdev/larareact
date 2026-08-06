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
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
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
}

interface PageProps {
    items: Paginated<IvmsPlateEvent>;
    filters: {
        plate_number?: string;
        camera_ip?: string;
        list_type?: string;
        direction?: string;
    };
    error: string | null;
}

export default function ControlAccesoEventosVehiculares({ items, filters, error }: PageProps) {
    const { __ } = useTranslate();

    const [plateNumber, setPlateNumber] = React.useState(filters.plate_number || '');
    const [cameraIp, setCameraIp] = React.useState(filters.camera_ip || '');
    const [listType, setListType] = React.useState(filters.list_type || '');
    const [direction, setDirection] = React.useState(filters.direction || '');
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
        plate_number: plateNumber || undefined,
        camera_ip: cameraIp || undefined,
        list_type: listType || undefined,
        direction: direction || undefined,
    });

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(window.location.pathname, currentFilters, { preserveState: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plateNumber, cameraIp, listType, direction]);

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
        { header: 'Vehicle', hideOn: 'mobile', cell: (row) => [row.vehicle_color, row.vehicle_type].filter(Boolean).join(' / ') || '—' },
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
                        src={`/admin/control-acceso/eventos-vehiculares/${row.id}/foto/0`}
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
                        <FilterField label={__('Plate Number')}>
                            <Input
                                placeholder={__('Search by plate')}
                                className="w-full md:w-48"
                                value={plateNumber}
                                onChange={(e) => setPlateNumber(e.target.value)}
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
