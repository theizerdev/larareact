import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    Eye,
    Fingerprint,
    ImageDown,
    ImageUp,
    Link2,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    UserCheck,
    Users,
    UserX,
} from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterSync } from '@/hooks/use-filter-search';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface HoshoEmpleadoRef {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    codigo_nuevo: string | null;
    codigo_anterior: string | null;
    numero_tarjeta: string | null;
    correo: string | null;
    telefono: string | null;
    genero: string | null;
    fecha_nacimiento: string | null;
    fecha_ingreso: string | null;
    foto_empleado: string | null;
    biotime_pushed_at: string | null;
    biotime_push_error: string | null;
}

interface BiotimeEmpleado {
    id: number;
    biotime_id: string | number;
    emp_code: string;
    card_no: string | null;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    nombre_completo: string;
    national: string | null;
    gender: string | null;
    birthday: string | null;
    hire_date: string | null;
    email: string | null;
    mobile: string | null;
    dept_code: string | null;
    dept_name: string | null;
    position_code: string | null;
    position_name: string | null;
    area_names: string[];
    internal_emp_num: string | null;
    payroll_num: string | null;
    enable_att: boolean | null;
    biophoto_path?: string | null;
    foto_exportada: string | null;
    foto_exportada_at: string | null;
    photo_synced_at: string | null;
    foto_biotime_url?: string;
    updated_at: string | null;
    link_status: 'auto' | 'manual' | 'unmatched';
    empleado_id: number | null;
    biometrics?: {
        face?: string | null;
        vl_face?: string | null;
        fingerprint?: string | null;
        palm?: string | null;
        update_time?: string | null;
    };
    empleado?: HoshoEmpleadoRef | null;
}

interface PageProps {
    empleados: Paginated<BiotimeEmpleado>;
    stats: {
        total: number;
        con_tarjeta: number;
        vinculados: number;
        sin_vincular: number;
        fotos_pendientes: number;
    };
    filters: { search?: string; link_status?: string; perPage?: string; sortBy?: string; sortDir?: string };
    empleados_hosho: { id: number; label: string }[];
}

const normalizarTarjeta = (val: string | null | undefined): string | null => {
    const clean = (val ?? '').trim();

    if (!clean || /^0+$/.test(clean)) {
        return null;
    }

    return clean;
};

const formatFecha = (val: string | null | undefined): string => {
    if (!val) {
        return '—';
    }

    return val.slice(0, 10);
};

const formatFechaHora = (val: string | null | undefined): string => {
    if (!val) {
        return '—';
    }

    const d = new Date(val);

    if (Number.isNaN(d.getTime())) {
        return val;
    }

    return d.toLocaleString('es-MX');
};

const formatGenero = (g: string | null | undefined): string => {
    const up = (g ?? '').trim().toUpperCase();

    if (up === 'M') {
        return 'Masculino (M)';
    }

    if (up === 'F') {
        return 'Femenino (F)';
    }

    return g || '—';
};

const FALLBACK_AVATAR =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

export default function BioTimeEmpleados({ empleados, stats, filters, empleados_hosho }: PageProps) {
    const { __ } = useTranslate();
    const [search, setSearch] = React.useState(filters.search || '');
    const [linkStatus, setLinkStatus] = React.useState(filters.link_status || 'all');
    const [busy, setBusy] = React.useState(false);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [isTableLoading, setIsTableLoading] = React.useState(false);
    const [selected, setSelected] = React.useState<BiotimeEmpleado | null>(null);

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
        link_status: linkStatus !== 'all' ? linkStatus : undefined,
        perPage: filters.perPage,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
    });
    useFilterSync(currentFilters);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Employees'), href: '/admin/biotime/empleados' },
    ];

    const linkTo = (row: BiotimeEmpleado, empleadoId: string) => {
        router.put(
            `/admin/biotime/empleados/${row.id}/vincular`,
            { empleado_id: empleadoId === 'none' ? null : Number(empleadoId) },
            { preserveScroll: true, preserveState: true },
        );
    };

    const autoLink = () => {
        setBusy(true);
        router.post('/admin/biotime/empleados/auto-vincular', {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const sync = () => {
        setIsSyncing(true);
        router.post('/admin/biotime/sync', { only: 'employees' }, { preserveScroll: true, onFinish: () => setIsSyncing(false) });
    };

    const columns: ColumnDef<BiotimeEmpleado>[] = [
        {
            header: __('Foto BioTime'),
            className: 'w-14 text-center',
            cell: (r) => (
                <div className="flex items-center justify-center">
                    <img
                        src={`/admin/biotime/empleados/${r.id}/foto`}
                        loading="lazy"
                        alt={`${r.first_name ?? ''} ${r.last_name ?? ''}`}
                        title={__('Foto guardada en BioTime')}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm bg-slate-100 dark:bg-slate-800 dark:border-slate-700"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.currentTarget;
                            target.src = FALLBACK_AVATAR;
                            target.title = __('Sin foto en BioTime');
                        }}
                    />
                    {r.biophoto_path && (
                        <img
                            src={`/admin/biotime/empleados/${r.id}/foto?tipo=bio`}
                            loading="lazy"
                            alt="Bio-foto"
                            title="Bio-foto"
                            className="-ml-3 mt-5 w-6 h-6 rounded-full object-cover border-2 border-emerald-500 shadow-sm bg-slate-100 dark:bg-slate-800"
                        />
                    )}
                </div>
            ),
        },
        {
            header: __('Code'),
            accessorKey: 'emp_code',
            sortable: true,
            className: 'whitespace-nowrap',
            cell: (r) => (
                <div className="space-y-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.emp_code}</span>
                    {r.enable_att !== null && (
                        <div>
                            <span
                                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                    r.enable_att
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                }`}
                            >
                                {r.enable_att ? 'Asistencia activa' : 'Deshabilitado'}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'N° de Tarjeta',
            accessorKey: 'card_no',
            sortable: true,
            className: 'whitespace-nowrap',
            cell: (r) => {
                const bioCard = normalizarTarjeta(r.card_no);
                const hoshoCard = normalizarTarjeta(r.empleado?.numero_tarjeta);
                const difiere = Boolean(r.empleado && (bioCard || hoshoCard) && bioCard !== hoshoCard);

                return (
                    <div className="space-y-1">
                        {bioCard ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                <CreditCard className="h-3 w-3 shrink-0" />
                                {bioCard}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {difiere && (
                            <p className="font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                Hoshō: {hoshoCard || '—'}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            header: __('Name'),
            accessorKey: 'first_name',
            sortKey: 'first_name',
            sortable: true,
            cell: (r) => {
                const nombre = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—';

                return (
                    <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{nombre}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            {r.gender && <span>Sexo: {r.gender}</span>}
                            {r.national && <span className="font-mono">ID: {r.national}</span>}
                            {r.nickname && <span>Alias: {r.nickname}</span>}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Depto. / Cargo / Área',
            sortKey: 'dept_code',
            sortable: true,
            hideOn: 'mobile',
            cell: (r) => (
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                        <span>{r.dept_name || r.dept_code || '—'}</span>
                        {r.dept_name && r.dept_code && (
                            <span className="font-mono text-[10px] text-muted-foreground">({r.dept_code})</span>
                        )}
                    </div>
                    {(r.position_name || r.position_code) && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            <span>{r.position_name || r.position_code}</span>
                        </div>
                    )}
                    {r.area_names && r.area_names.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                            {r.area_names.map((area) => (
                                <Badge key={area} variant="secondary" className="px-1.5 py-0 text-[10px]">
                                    {area}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Contacto / Fechas',
            hideOn: 'tablet',
            cell: (r) => (
                <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                    {r.email ? (
                        <div className="flex items-center gap-1.5 max-w-[220px] truncate" title={r.email}>
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{r.email}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Sin correo</span>
                    )}
                    {r.mobile && (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{r.mobile}</span>
                        </div>
                    )}
                    {(r.hire_date || r.birthday) && (
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground pt-0.5">
                            {r.hire_date && (
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    Ing: {formatFecha(r.hire_date)}
                                </span>
                            )}
                            {r.birthday && <span>Nac: {formatFecha(r.birthday)}</span>}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: __('Link status'),
            sortKey: 'link_status',
            sortable: true,
            cell: (r) => (
                <div className="flex flex-col items-start gap-1">
                    <LinkBadge status={r.link_status} />
                    {r.empleado?.foto_empleado && r.empleado.foto_empleado !== r.foto_exportada && (
                        <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            title={__('The photo has not been exported to BioTime yet.')}
                        >
                            {__('Photo pending')}
                        </span>
                    )}
                    {r.empleado?.biotime_push_error && (
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            title={r.empleado.biotime_push_error}
                        >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Error envío
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: __('Hoshō employee'),
            stopRowClick: true,
            cell: (r) => (
                <Select value={r.empleado_id ? String(r.empleado_id) : 'none'} onValueChange={(v) => linkTo(r, v)}>
                    <SelectTrigger className="h-8 w-[220px] text-xs">
                        <SelectValue placeholder={__('Not linked')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">{__('Not linked')}</SelectItem>
                        {empleados_hosho.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                                {e.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
        {
            header: 'Detalle',
            stopRowClick: true,
            hideable: false,
            className: 'w-20 text-right',
            cell: (r) => (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setSelected(r)}
                >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                </Button>
            ),
        },
    ];

    const selectedBioCard = normalizarTarjeta(selected?.card_no);
    const selectedHoshoCard = normalizarTarjeta(selected?.empleado?.numero_tarjeta);
    const tarjetasCoinciden = Boolean(selected?.empleado && (selectedBioCard || selectedHoshoCard) && selectedBioCard === selectedHoshoCard);
    const tarjetasDifieren = Boolean(selected?.empleado && (selectedBioCard || selectedHoshoCard) && selectedBioCard !== selectedHoshoCard);

    return (
        <>
            <Head title={__('BioTime Employees')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Fingerprint className="h-6 w-6 text-white" />}
                    title={__('BioTime Employees')}
                    description={__('Consulta de solo lectura de los datos recibidos de BioTime (incluyendo N° de Tarjeta) y su vínculo con Hoshō.')}
                    colorClassName="bg-rose-600"
                >
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={autoLink} disabled={busy} variant="secondary" className="gap-2">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            {__('Auto-link')}
                        </Button>
                        <Button onClick={sync} disabled={busy || isSyncing} variant="secondary" className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? __('Sincronizando...') : __('Sync now')}
                        </Button>
                        {/* Recarga al volver del ZIP para que el conteo de pendientes baje. */}
                        <Button asChild variant="secondary" className="gap-2" title={__('Only photos that are new or changed since the last ZIP. JPG files of up to 25 KB named with the employee number, for BioTime › Device › Data › Bio-Photo › Import Bio-Photo.')}>
                            <a href="/admin/biotime/fotos/exportar" onClick={() => setTimeout(() => router.reload({ only: ['empleados', 'stats'] }), 2500)}>
                                <ImageDown className="h-4 w-4" />
                                {__('Export pending photos')} ({stats.fotos_pendientes})
                            </a>
                        </Button>
                        <Button asChild variant="ghost" className="gap-2" title={__('All photos of linked employees, including those already exported.')}>
                            <a href="/admin/biotime/fotos/exportar?todas=1" onClick={() => setTimeout(() => router.reload({ only: ['empleados', 'stats'] }), 2500)}>
                                {__('Export all')}
                            </a>
                        </Button>
                    </div>
                </ModuleHeader>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard icon={<Users className="h-5 w-5 text-white" />} title={__('Total')} value={stats.total} colorClassName="bg-rose-500" />
                    <StatCard icon={<CreditCard className="h-5 w-5 text-white" />} title="Con N° de Tarjeta" value={stats.con_tarjeta} colorClassName="bg-amber-500" />
                    <StatCard icon={<UserCheck className="h-5 w-5 text-white" />} title={__('Linked')} value={stats.vinculados} colorClassName="bg-emerald-500" />
                    <StatCard icon={<UserX className="h-5 w-5 text-white" />} title={__('Unlinked')} value={stats.sin_vincular} colorClassName="bg-slate-500" />
                    <StatCard icon={<ImageUp className="h-5 w-5 text-white" />} title={__('Photos pending for BioTime')} value={stats.fotos_pendientes} colorClassName="bg-sky-500" />
                </div>

                <FilterBar>
                    <div className="flex flex-wrap items-end gap-4">
                        <FilterField label={__('Search')}>
                            <Input
                                placeholder="Código, N° de tarjeta, nombre, correo o ID nacional"
                                className="w-full md:w-96"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Link status')}>
                            <Select value={linkStatus} onValueChange={setLinkStatus}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('All')}</SelectItem>
                                    <SelectItem value="auto">{__('Auto')}</SelectItem>
                                    <SelectItem value="manual">{__('Manual')}</SelectItem>
                                    <SelectItem value="unmatched">{__('Unlinked')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    data={empleados}
                    columns={columns}
                    filters={currentFilters}
                    isLoading={isTableLoading}
                    onRowClick={setSelected}
                    emptyState={{
                        title: __('No employees yet'),
                        description: __('Run a sync to pull employees from BioTime.'),
                    }}
                />
            </div>

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
                    {selected && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <img
                                        src={`/admin/biotime/empleados/${selected.id}/foto`}
                                        alt={selected.nombre_completo}
                                        className="h-14 w-14 rounded-full object-cover border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_AVATAR;
                                        }}
                                    />
                                    <div className="space-y-1.5 min-w-0">
                                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                            {selected.nombre_completo || 'Sin nombre'}
                                        </DialogTitle>
                                        <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="font-mono font-semibold text-foreground">
                                                Código BioTime: {selected.emp_code}
                                            </span>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                                <CreditCard className="h-3 w-3" />
                                                N° de Tarjeta: {selectedBioCard || '—'}
                                            </span>
                                            <LinkBadge status={selected.link_status} />
                                            {selected.enable_att !== null && (
                                                <Badge variant={selected.enable_att ? 'default' : 'destructive'} className="text-[10px]">
                                                    {selected.enable_att ? 'Asistencia activa' : 'Deshabilitado'}
                                                </Badge>
                                            )}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                                Vista de <strong>solo lectura</strong> con los datos actuales almacenados en el espejo de BioTime para validar la sincronización entre Hoshō y BioTime.
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border bg-card p-4 space-y-2.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Identificación y Tarjeta (BioTime)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <DatoSoloLectura label="emp_code" value={selected.emp_code} mono />
                                        <DatoSoloLectura label="N° de Tarjeta (card_no)" value={selectedBioCard || '—'} mono highlight />
                                        <DatoSoloLectura label="ID BioTime" value={String(selected.biotime_id)} mono />
                                        <DatoSoloLectura label="ID Nacional / CURP" value={selected.national || '—'} mono />
                                        <DatoSoloLectura label="N° Interno" value={selected.internal_emp_num || '—'} mono />
                                        <DatoSoloLectura label="N° Nómina" value={selected.payroll_num || '—'} mono />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-card p-4 space-y-2.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Datos Personales y Organización (BioTime)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <DatoSoloLectura label="Nombre(s)" value={selected.first_name || '—'} />
                                        <DatoSoloLectura label="Apellido(s)" value={selected.last_name || '—'} />
                                        <DatoSoloLectura label="Sexo" value={formatGenero(selected.gender)} />
                                        <DatoSoloLectura label="Fecha de Nacimiento" value={formatFecha(selected.birthday)} mono />
                                        <DatoSoloLectura label="Fecha de Ingreso" value={formatFecha(selected.hire_date)} mono />
                                        <DatoSoloLectura label="Apodo" value={selected.nickname || '—'} />
                                        <DatoSoloLectura
                                            label="Departamento"
                                            value={
                                                selected.dept_name
                                                    ? `${selected.dept_name}${selected.dept_code ? ` (${selected.dept_code})` : ''}`
                                                    : selected.dept_code || '—'
                                            }
                                        />
                                        <DatoSoloLectura
                                            label="Cargo / Puesto"
                                            value={
                                                selected.position_name
                                                    ? `${selected.position_name}${selected.position_code ? ` (${selected.position_code})` : ''}`
                                                    : selected.position_code || '—'
                                            }
                                        />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-[11px] font-medium text-muted-foreground mb-1">Áreas en BioTime</p>
                                        {selected.area_names && selected.area_names.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {selected.area_names.map((a) => (
                                                    <Badge key={a} variant="secondary" className="text-[11px]">
                                                        {a}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-card p-4 space-y-2.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Contacto y Biometría (BioTime)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <DatoSoloLectura label="Correo Electrónico" value={selected.email || '—'} />
                                        <DatoSoloLectura label="Teléfono Móvil" value={selected.mobile || '—'} mono />
                                        <DatoSoloLectura label="Rostro (face / vl_face)" value={`${selected.biometrics?.face || '—'} / ${selected.biometrics?.vl_face || '—'}`} mono />
                                        <DatoSoloLectura label="Huella / Palma" value={`${selected.biometrics?.fingerprint || '—'} / ${selected.biometrics?.palm || '—'}`} mono />
                                        <DatoSoloLectura label="Última act. en BioTime" value={selected.biometrics?.update_time || '—'} mono />
                                        <DatoSoloLectura label="Espejo actualizado" value={formatFechaHora(selected.updated_at)} mono />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-card p-4 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Comparativa en Hoshō (Solo lectura)
                                        </h4>
                                        {tarjetasCoinciden && (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Tarjeta coincide
                                            </Badge>
                                        )}
                                        {tarjetasDifieren && (
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 text-[10px] gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Tarjeta difiere
                                            </Badge>
                                        )}
                                    </div>

                                    {selected.empleado ? (
                                        <div className="space-y-2.5 text-xs">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <DatoSoloLectura
                                                    label="Colaborador"
                                                    value={`${selected.empleado.nombres} ${selected.empleado.apellidos}`.trim()}
                                                />
                                                <DatoSoloLectura
                                                    label="Código Nuevo / Doc."
                                                    value={selected.empleado.codigo_nuevo || selected.empleado.documento_identidad || '—'}
                                                    mono
                                                />
                                                <DatoSoloLectura
                                                    label="N° de Tarjeta en Hoshō"
                                                    value={selectedHoshoCard || '—'}
                                                    mono
                                                    highlight
                                                />
                                                <DatoSoloLectura
                                                    label="N° de Tarjeta en BioTime"
                                                    value={selectedBioCard || '—'}
                                                    mono
                                                    highlight
                                                />
                                                <DatoSoloLectura label="Correo en Hoshō" value={selected.empleado.correo || '—'} />
                                                <DatoSoloLectura label="Teléfono en Hoshō" value={selected.empleado.telefono || '—'} mono />
                                                <DatoSoloLectura label="Nacimiento / Ingreso" value={`${selected.empleado.fecha_nacimiento || '—'} / ${selected.empleado.fecha_ingreso || '—'}`} mono />
                                                <DatoSoloLectura label="Último envío a BioTime" value={formatFechaHora(selected.empleado.biotime_pushed_at)} mono />
                                            </div>
                                            {selected.empleado.biotime_push_error && (
                                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                                                    <strong>Último error de envío:</strong> {selected.empleado.biotime_push_error}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground py-4">
                                            Este registro de BioTime aún no está vinculado a un colaborador en Hoshō.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function DatoSoloLectura({
    label,
    value,
    mono = false,
    highlight = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground truncate">{label}</p>
            <p
                className={`truncate ${mono ? 'font-mono' : ''} ${
                    highlight
                        ? 'font-bold text-amber-800 dark:text-amber-300'
                        : 'font-semibold text-slate-900 dark:text-slate-100'
                }`}
                title={value}
            >
                {value}
            </p>
        </div>
    );
}

function LinkBadge({ status }: { status: 'auto' | 'manual' | 'unmatched' }) {
    const { __ } = useTranslate();
    const map = {
        auto: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        manual: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        unmatched: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
    } as const;
    const label = { auto: __('Auto'), manual: __('Manual'), unmatched: __('Unlinked') }[status];

    return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[status]}`}>{label}</span>;
}
