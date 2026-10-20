import { Head, router } from '@inertiajs/react';
import { CalendarClock, Clock, Loader2, RefreshCw, Users } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFilterSync } from '@/hooks/use-filter-search';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface Horario {
    id: number;
    biotime_id: string;
    alias: string | null;
    use_mode: string | null;
    in_time: string | null;
    out_time: string | null;
    duration: number | null;
    work_time_duration: number | null;
    break_time_duration: number | null;
    cross_day: boolean;
    in_required: boolean | null;
    out_required: boolean | null;
}

interface Turno {
    id: number;
    biotime_id: string;
    alias: string | null;
    horarios: string[];
    cycle_unit: string | null;
    shift_cycle: number | null;
    calendarios_count: number;
}

interface Calendario {
    id: number;
    employee_biotime_id: string | null;
    start_date: string | null;
    end_date: string | null;
    biotime_empleado?: { id: number; emp_code: string; first_name: string | null; last_name: string | null } | null;
    turno?: { id: number; alias: string | null } | null;
}

interface PageProps {
    horarios: Horario[];
    turnos: Turno[];
    calendarios: Paginated<Calendario>;
    filters: { search?: string; turno?: string; perPage?: string };
    biotime_active: boolean;
}

/** "09:00:00" → "09:00" */
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '—');

/** Minutos → "8 h 30 min" */
const duracion = (min: number | null) => {
    if (min === null || min === undefined) {
return '—';
}

    const h = Math.floor(min / 60);
    const m = min % 60;

    return m ? `${h} h ${m} min` : `${h} h`;
};

/** "2026-04-01T00:00:00.000000Z" o "2026-04-01" → fecha local sin desfase de zona. */
const fecha = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—');

export default function BioTimeTurnos({ horarios, turnos, calendarios, filters, biotime_active }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = React.useState(filters.search || '');
    const [turno, setTurno] = React.useState(filters.turno || 'all');
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
        turno: turno !== 'all' ? turno : undefined,
        perPage: filters.perPage,
    });
    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Shifts'), href: '/admin/biotime/turnos' },
    ];

    const sync = () => {
        setSyncing(true);
        router.post('/admin/biotime/sync', { only: 'attendance' }, { preserveScroll: true, onFinish: () => setSyncing(false) });
    };

    const columns: ColumnDef<Calendario>[] = [
        {
            header: __('Employee'),
            cell: (r) => {
                const be = r.biotime_empleado;

                if (!be) {
return `#${r.employee_biotime_id ?? '—'}`;
}

                const name = `${be.first_name ?? ''} ${be.last_name ?? ''}`.trim();

                return name ? `${name} (${be.emp_code})` : be.emp_code;
            },
        },
        { header: __('Shift'), cell: (r) => r.turno?.alias || '—' },
        { header: __('From'), cell: (r) => fecha(r.start_date), className: 'whitespace-nowrap' },
        { header: __('To'), cell: (r) => fecha(r.end_date), className: 'whitespace-nowrap', hideOn: 'mobile' },
    ];

    return (
        <>
            <Head title={__('BioTime Shifts')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<CalendarClock className="h-6 w-6 text-white" />}
                    title={__('BioTime Shifts')}
                    description={__('Time tables, shifts and employee schedules mirrored from BioTime. Separate from the app work shifts.')}
                    colorClassName="bg-rose-600"
                >
                    <Button onClick={sync} disabled={syncing || !biotime_active} variant="secondary" className="gap-2">
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {__('Sync now')}
                    </Button>
                </ModuleHeader>

                {/* Turnos */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">{__('Shifts')}</h2>
                    {turnos.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-muted-foreground">
                                {__('No shifts yet. Run a sync to pull them from BioTime.')}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {turnos.map((t) => (
                                <Card key={t.id} className="border-t-4 border-t-rose-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-base">{t.alias || `#${t.biotime_id}`}</CardTitle>
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3.5 w-3.5" />
                                                {t.calendarios_count}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex flex-wrap gap-1.5">
                                            {t.horarios.length === 0 ? (
                                                <span className="text-muted-foreground">—</span>
                                            ) : (
                                                t.horarios.map((h) => (
                                                    <span
                                                        key={h}
                                                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        {h}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        {t.shift_cycle !== null && (
                                            <p className="text-xs text-muted-foreground">
                                                {__('Cycle')}: {t.shift_cycle} {t.cycle_unit ?? ''}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Horarios */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">{__('Time tables')}</h2>
                    <Card>
                        <CardContent className="p-0">
                            {horarios.length === 0 ? (
                                <p className="py-10 text-center text-muted-foreground">{__('No time tables yet. Run a sync to pull them from BioTime.')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{__('Name')}</TableHead>
                                                <TableHead>{__('Check-in')}</TableHead>
                                                <TableHead>{__('Check-out')}</TableHead>
                                                <TableHead>{__('Duration')}</TableHead>
                                                <TableHead className="hidden md:table-cell">{__('Break')}</TableHead>
                                                <TableHead className="hidden md:table-cell">{__('Crosses midnight')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {horarios.map((h) => (
                                                <TableRow key={h.id}>
                                                    <TableCell className="font-medium">{h.alias || `#${h.biotime_id}`}</TableCell>
                                                    <TableCell className="font-mono">{hhmm(h.in_time)}</TableCell>
                                                    <TableCell className="font-mono">{hhmm(h.out_time)}</TableCell>
                                                    <TableCell>{duracion(h.work_time_duration ?? h.duration)}</TableCell>
                                                    <TableCell className="hidden md:table-cell">{duracion(h.break_time_duration)}</TableCell>
                                                    <TableCell className="hidden md:table-cell">{h.cross_day ? __('Yes') : __('No')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* Calendarios */}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">{__('Employee schedules')}</h2>
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
                            <FilterField label={__('Shift')}>
                                <Select value={turno} onValueChange={setTurno}>
                                    <SelectTrigger className="w-full md:w-56">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{__('All')}</SelectItem>
                                        {turnos.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.alias || `#${t.biotime_id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                        </div>
                    </FilterBar>

                    <DataTable
                        data={calendarios}
                        columns={columns}
                        filters={currentFilters}
                        isLoading={isTableLoading}
                        emptyState={{
                            title: __('No schedules found'),
                            description: __('Adjust the filters or run a sync to pull schedules from BioTime.'),
                        }}
                    />
                </section>
            </div>
        </>
    );
}
