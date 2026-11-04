import { Head, router } from '@inertiajs/react';
import {
    ShoppingCart,
    Receipt,
    CheckCircle,
    Eye,
    CreditCard,
    DollarSign,
    Calendar,
    CalendarDays,
    Clock,
    User,
    Printer,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Layers,
    List,
    X,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from '@/components/qr-code-svg';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import Pagination from '@/components/pagination';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';

interface SaleItem {
    id: number;
    nombre: string;
    concepto_tipo: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface Sale {
    id: number;
    codigo_ticket: string;
    cliente_nombre: string;
    metodo_pago: string;
    subtotal: number;
    impuesto: number;
    descuento: number;
    total: number;
    monto_recibido: number;
    cambio: number;
    estado: 'completada' | 'anulada';
    notas: string | null;
    user?: { name: string };
    empleado_id?: number | null;
    empleado?: { id: number; nombre_completo: string; cargo?: string } | null;
    comision_porcentaje?: number;
    comision_monto?: number;
    items: SaleItem[];
    created_at: string;
}

interface EmpresaData {
    razon_social?: string;
    documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    logo?: string;
}

interface Props {
    sales: Paginated<Sale>;
    currencySymbol?: string;
    empresa?: EmpresaData | null;
    filters: {
        search?: string;
        status?: string;
        perPage?: string;
        date_from?: string;
        date_to?: string;
    };
}

    // Helper to extract local YYYY-MM-DD
    function getDateKey(dateStr: string): string {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper to format date header in Spanish
    function formatDateHeader(dateKey: string) {
        const [year, month, day] = dateKey.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);

        const today = new Date();
        const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month - 1 &&
            today.getDate() === day;

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday =
            yesterday.getFullYear() === year &&
            yesterday.getMonth() === month - 1 &&
            yesterday.getDate() === day;

        const formatted = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const label = formatted.charAt(0).toUpperCase() + formatted.slice(1);

        return {
            label,
            isToday,
            isYesterday,
            badge: isToday ? 'Hoy' : isYesterday ? 'Ayer' : null,
        };
    }

    // Helper to format time (HH:mm)
    function formatTime(dateStr: string): string {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    }

    export default function Index({
        sales,
        currencySymbol = '$',
        empresa,
        filters,
    }: Props) {
        const { __ } = useTranslate();
        const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

        // Dynamic QR Code SVG Generator for Ticket Validation
        const renderTicketQRCode = (ticketCode: string, totalAmount: number) => {
            const qrData = encodeURIComponent(`TICKET:${ticketCode}|TOTAL:${totalAmount}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
            return (
                <div className="flex flex-col items-center justify-center space-y-1">
                    <img
                        src={qrUrl}
                        alt={`QR Code ${ticketCode}`}
                        className="h-20 w-20 object-contain p-1 bg-white border border-gray-200 rounded"
                    />
                    <span className="text-[9px] font-mono text-slate-500 font-bold">ESCANEAR PARA VALIDAR</span>
                </div>
            );
            // View mode: accordion grouped by date vs flat table
            const [viewMode, setViewMode] = useState<'accordion' | 'table'>(() => {
                if (typeof window !== 'undefined') {
                    const saved = localStorage.getItem('ventas_view_mode');
                    if (saved === 'accordion' || saved === 'table') return saved;
                }
                return 'accordion';
            });

            const handleViewModeChange = (mode: 'accordion' | 'table') => {
                setViewMode(mode);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('ventas_view_mode', mode);
                }
            };

            // Filters
            // Filters state
            const [searchTerm, setSearchTerm] = useState(filters.search || '');
            const [statusFilter, setStatusFilter] = useState(filters.status || '');
            const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');
            const [dateFrom, setDateFrom] = useState(filters.date_from || '');
            const [dateTo, setDateTo] = useState(filters.date_to || '');

            React.useEffect(() => {
                useEffect(() => {
                    const timer = setTimeout(() => {
                        router.get(
                            window.location.pathname,
                            cleanParams({ search: searchTerm, status: statusFilter, perPage: perPageFilter }),
                            { preserveState: true, preserveScroll: true }
                cleanParams({
                                search: searchTerm,
                                status: statusFilter,
                                perPage: perPageFilter,
                                date_from: dateFrom,
                                date_to: dateTo,
                            }),
                            { preserveState: true, preserveScroll: true },
                        );
                    }, 300);

                    return () => clearTimeout(timer);
                }, [searchTerm, statusFilter, perPageFilter]);
            }, [searchTerm, statusFilter, perPageFilter, dateFrom, dateTo]);

            // Grouping sales by date
            const groupedSales = useMemo(() => {
                const groups: Record<
                    string,
                    {
                        dateKey: string;
                        dateInfo: ReturnType<typeof formatDateHeader>;
                        sales: Sale[];
                        totalAmount: number;
                        totalCount: number;
                        completedCount: number;
                        anuladaCount: number;
                    }
                > = {};

                sales.data.forEach((sale) => {
                    const key = getDateKey(sale.created_at);
                    if (!groups[key]) {
                        groups[key] = {
                            dateKey: key,
                            dateInfo: formatDateHeader(key),
                            sales: [],
                            totalAmount: 0,
                            totalCount: 0,
                            completedCount: 0,
                            anuladaCount: 0,
                        };
                    }
                    groups[key].sales.push(sale);
                    groups[key].totalCount += 1;
                    if (sale.estado === 'completada') {
                        groups[key].totalAmount += Number(sale.total || 0);
                        groups[key].completedCount += 1;
                    } else {
                        groups[key].anuladaCount += 1;
                    }
                });

                return Object.values(groups);
            }, [sales.data]);

            // Accordion expand/collapse state
            const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

            // Keep groups open when groupedSales updates (default first or all open)
            useEffect(() => {
                if (groupedSales.length > 0) {
                    setOpenGroups((prev) => {
                        const next = { ...prev };
                        groupedSales.forEach((group, idx) => {
                            if (next[group.dateKey] === undefined) {
                                // Open the first group by default, or all if 3 or fewer
                                next[group.dateKey] =
                                    idx === 0 || groupedSales.length <= 3;
                            }
                        });
                        return next;
                    });
                }
            }, [groupedSales]);

            const toggleGroup = (dateKey: string) => {
                setOpenGroups((prev) => ({
                    ...prev,
                    [dateKey]: !prev[dateKey],
                }));
            };

            const expandAll = () => {
                const next: Record<string, boolean> = {};
                groupedSales.forEach((g) => {
                    next[g.dateKey] = true;
                });
                setOpenGroups(next);
            };

            const collapseAll = () => {
                const next: Record<string, boolean> = {};
                groupedSales.forEach((g) => {
                    next[g.dateKey] = false;
                });
                setOpenGroups(next);
            };

            const breadcrumbs = [
                { title: __('Dashboard'), href: '/admin/dashboard' },
                { title: __('Punto de Venta'), href: '#' },
                { title: __('Historial de Ventas'), href: '/admin/ventas' },
            ];

            // Standard columns for flat table
            const columns: ColumnDef<Sale>[] = [
                {
                    header: __('Ticket'),
                    accessorKey: 'codigo_ticket',
                    cell: (sale) => (
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                            <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
                                {sale.codigo_ticket}
                            </span>
                            ),
        },
                            {
                                header: __('Cliente'),
                            accessorKey: 'cliente_nombre',
            cell: (sale) => (
                            <span className="font-medium text-sm">
                                {sale.cliente_nombre || 'Cliente General'}
                                <span className="text-sm font-medium">
                                    {sale.cliente_nombre || __('Cliente General')}
                                </span>
                                ),
        },
                                {
                                    header: __('Vendedor'),
                                accessorKey: 'empleado.nombre_completo',
            cell: (sale) => (
            cell: (sale) =>
                                sale.empleado ? (
                                <div>
                                    <span className="font-semibold text-xs text-foreground block">
                                        <span className="block text-xs font-semibold text-foreground">
                                            {sale.empleado.nombre_completo}
                                        </span>
                                        {Number(sale.comision_monto || 0) > 0 && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                                +{currencySymbol}{Number(sale.comision_monto).toFixed(2)} ({Number(sale.comision_porcentaje).toFixed(1)}%)
                                                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    +{currencySymbol}
                                                    {Number(sale.comision_monto).toFixed(2)} (
                                                    {Number(sale.comision_porcentaje).toFixed(1)}%)
                                                </span>
                        )}
                                            </div>
                                        ) : (
                                        <span className="text-xs text-muted-foreground italic">-</span>
                                        )
                                        ),
                                        <span className="text-xs text-muted-foreground italic">
                                            -
                                        </span>
                                        ),
        },
                                        {
                                            header: __('Método de Pago'),
                                        accessorKey: 'metodo_pago',
            cell: (sale) => (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            <CreditCard className="w-3 h-3 text-slate-500" />
                                            {sale.metodo_pago.toUpperCase()}
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <CreditCard className="h-3 w-3 text-slate-500" />
                                                {sale.metodo_pago
                                                    ? sale.metodo_pago.toUpperCase().replace('_', ' ')
                                                    : 'EFECTIVO'}
                                            </span>
                                            ),
        },
                                            {
                                                header: __('Total Venta'),
                                            accessorKey: 'total',
            cell: (sale) => (
                                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                {currencySymbol}{Number(sale.total || 0).toFixed(2)}
                                                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    {currencySymbol}
                                                    {Number(sale.total || 0).toFixed(2)}
                                                </span>
                                                ),
        },
                                                {
                                                    header: __('Cajero'),
                                                accessorKey: 'user.name',
            cell: (sale) => (
                                                <span className="text-xs text-muted-foreground">
                                                    {sale.user?.name || '-'}
                                                </span>
                                                ),
        },
                                                {
                                                    header: __('Estado'),
                                                accessorKey: 'estado',
            cell: (sale) => (
                                                <span className={cn(
                                                    'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                                                    sale.estado === 'completada'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                                                )}>
                                                    {sale.estado === 'completada' ? __('Completada') : __('Anulada')}
                                                    <span
                                                        className={cn(
                                                            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                                            sale.estado === 'completada'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400',
                                                        )}
                                                    >
                                                        {sale.estado === 'completada'
                                                            ? __('Completada')
                                                            : __('Anulada')}
                                                    </span>
                                                    ),
        },
                                                    {
                                                        header: __('Fecha y Hora'),
                                                    accessorKey: 'created_at',
            cell: (sale) => (
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(sale.created_at).toLocaleString()}
                                                    </span>
                                                    ),
        },
                                                    {
                                                        header: __('Acciones'),
                                                    className: 'text-right',
                                                    hideable: false,
                                                    stopRowClick: true,
            cell: (sale) => (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedSale(sale)}
                                                    >
                                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                        {__('Ver Ticket')}
                                                    </Button>
                                                    ),
        },
                                                    ];

    const totalVentasMonto = sales.data.reduce((acc, s) => acc + (s.estado === 'completada' ? Number(s.total || 0) : 0), 0);
                                                    const totalVentasMonto = sales.data.reduce(
        (acc, s) =>
                                                    acc + (s.estado === 'completada' ? Number(s.total || 0) : 0),
                                                    0,
                                                    );

    // Dynamic QR Code SVG Generator for Ticket Validation
    const renderTicketQRCode = (ticketCode: string, totalAmount: number) => {
        const qrData = encodeURIComponent(
                                                    `TICKET:${ticketCode}|TOTAL:${totalAmount}`,
                                                    );
                                                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
                                                    return (
                                                    <div className="flex flex-col items-center justify-center space-y-1">
                                                        <img
                                                            src={qrUrl}
                                                            alt={`QR Code ${ticketCode}`}
                                                            className="h-20 w-20 rounded border border-gray-200 bg-white object-contain p-1"
                                                        />
                                                        <span className="font-mono text-[9px] font-bold text-slate-500">
                                                            ESCANEAR PARA VALIDAR
                                                        </span>
                                                    </div>
                                                    );
    };

                                                    const hasActiveFilters = Boolean(
                                                    searchTerm || statusFilter || dateFrom || dateTo,
                                                    );

                                                    return (
        <>
                                                        <Head title={__('Historial de Ventas - POS')} />

                                                        <div className="space-y-6">
                                                            <Breadcrumbs breadcrumbs={breadcrumbs} />

                                                            <ModuleHeader
                                                                icon={<Receipt className="h-6 w-6 text-white" />}
                                                                title={__('Historial de Ventas')}
                                                                description={__('Consulta y revisa todos los tickets de venta emitidos en el Punto de Venta.')}
                                                                description={__(
                                                                    'Consulta y revisa todos los tickets de venta emitidos en el Punto de Venta.',
                                                                )}
                                                                colorClassName="bg-indigo-600"
                                                            >
                                                                <Button onClick={() => router.get('/admin/ventas/terminal')}>
                                                                    <Button
                                                                        onClick={() => router.get('/admin/ventas/terminal')}
                                                                    >
                                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                                        {__('Ir a Terminal POS')}
                                                                    </Button>
                                                            </ModuleHeader>

                                                            {/* Stat Cards */}
                                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                                                <StatCard
                                                                    icon={<Receipt className="h-6 w-6" />}
                                                                    title={__('TOTAL REGISTROS')}
                                                                    value={sales.total || 0}
                                                                    colorClassName="bg-indigo-100 text-indigo-600"
                                                                />
                                                                <StatCard
                                                                    icon={<CheckCircle className="h-6 w-6" />}
                                                                    title={__('VENTAS EN ESTA PÁGINA')}
                                                                    value={sales.data.length}
                                                                    colorClassName="bg-blue-100 text-blue-600"
                                                                />
                                                                <StatCard
                                                                    icon={<DollarSign className="h-6 w-6" />}
                                                                    title={__('MONTO ACUMULADO (PÁG)')}
                                                                    value={`${currencySymbol}${totalVentasMonto.toFixed(2)}`}
                                                                    colorClassName="bg-emerald-100 text-emerald-600"
                                                                />
                                                            </div>

                                                            {/* Filtros */}
                                                            <FilterBar>
                                                                <div className="flex flex-wrap items-end gap-4">
                                                                    <div className="flex flex-wrap items-end gap-3 md:gap-4">
                                                                        <FilterField label={__('Buscar')}>
                                                                            <Input
                                                                                placeholder={__('Buscar por N° ticket, cliente...')}
                                                                                className="w-full md:w-96"
                                                                                placeholder={__(
                                                                                    'Buscar por N° ticket, cliente...',
                                                                                )}
                                                                                className="w-full md:w-80"
                                                                                value={searchTerm}
                                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                            />
                                                                        </FilterField>

                                                                        <FilterField label={__('Estado')}>
                                                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                                                <SelectTrigger className="w-full md:w-48">
                                                                                    <Select
                                                                                        value={statusFilter}
                                                                                        onValueChange={setStatusFilter}
                                                                                    >
                                                                                        <SelectTrigger className="w-full md:w-40">
                                                                                            <SelectValue placeholder={__('Todos')} />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="">{__('Todos')}</SelectItem>
                                                                                            <SelectItem value="completada">{__('Completada')}</SelectItem>
                                                                                            <SelectItem value="anulada">{__('Anulada')}</SelectItem>
                                                                                            <SelectItem value="">
                                                                                                {__('Todos')}
                                                                                            </SelectItem>
                                                                                            <SelectItem value="completada">
                                                                                                {__('Completada')}
                                                                                            </SelectItem>
                                                                                            <SelectItem value="anulada">
                                                                                                {__('Anulada')}
                                                                                            </SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </FilterField>
                                                                                <FilterField label={__('Registros por página')}>
                                                                                    <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                                                                        <SelectTrigger className="w-full md:w-40">

                                                                                            <FilterField label={__('Desde')}>
                                                                                                <Input
                                                                                                    type="date"
                                                                                                    className="w-full text-xs md:w-36"
                                                                                                    value={dateFrom}
                                                                                                    onChange={(e) => setDateFrom(e.target.value)}
                                                                                                />
                                                                                            </FilterField>

                                                                                            <FilterField label={__('Hasta')}>
                                                                                                <Input
                                                                                                    type="date"
                                                                                                    className="w-full text-xs md:w-36"
                                                                                                    value={dateTo}
                                                                                                    onChange={(e) => setDateTo(e.target.value)}
                                                                                                />
                                                                                            </FilterField>

                                                                                            <FilterField label={__('Por página')}>
                                                                                                <Select
                                                                                                    value={perPageFilter}
                                                                                                    onValueChange={setPerPageFilter}
                                                                                                >
                                                                                                    <SelectTrigger className="w-full md:w-32">
                                                                                                        <SelectValue />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="10">10</SelectItem>
                                                                                                        <SelectItem value="25">25</SelectItem>
                                                                                                        <SelectItem value="50">50</SelectItem>
                                                                                                        <SelectItem value="100">100</SelectItem>
                                                                                                        <SelectItem value="200">200</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            </FilterField>

                                                                                            {hasActiveFilters && (
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => {
                                                                                                        setSearchTerm('');
                                                                                                        setStatusFilter('');
                                                                                                        setDateFrom('');
                                                                                                        setDateTo('');
                                                                                                    }}
                                                                                                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                                                                    title={__('Limpiar filtros')}
                                                                                                >
                                                                                                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                                                                                    {__('Limpiar')}
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    </FilterBar>

                                                                                    <DataTable
                                                                                        columns={columns}
                                                                                        data={sales}
                                                                                    />
                                                                                    {/* Barra de Controles de Vista: Acordeón vs Tabla & Botones Expandir / Colapsar */}
                                                                                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/50">
                                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                                            {viewMode === 'accordion' &&
                                                                                                groupedSales.length > 0 && (
                                                                                                    <>
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            className="h-8 gap-1.5 text-xs font-semibold"
                                                                                                            onClick={expandAll}
                                                                                                        >
                                                                                                            <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
                                                                                                            {__('Expandir Todas')}
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="outline"
                                                                                                            size="sm"
                                                                                                            className="h-8 gap-1.5 text-xs font-semibold"
                                                                                                            onClick={collapseAll}
                                                                                                        >
                                                                                                            <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                                                                                                            {__('Colapsar Todas')}
                                                                                                        </Button>
                                                                                                        <span className="border-l border-slate-200 pl-2 text-xs text-muted-foreground dark:border-slate-800">
                                                                                                            {groupedSales.length}{' '}
                                                                                                            {groupedSales.length === 1
                                                                                                                ? __('fecha')
                                                                                                                : __('fechas')}
                                                                                                        </span>
                                                                                                    </>
                                                                                                )}
                                                                                        </div>

                                                                                        {/* Selector de modo de vista */}
                                                                                        <div className="inline-flex self-start rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs sm:self-auto dark:border-slate-800 dark:bg-slate-900">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleViewModeChange('accordion')}
                                                                                                className={cn(
                                                                                                    'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                                                                                                    viewMode === 'accordion'
                                                                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                                                                                                )}
                                                                                            >
                                                                                                <Layers className="h-3.5 w-3.5" />
                                                                                                <span>{__('Agrupado por Fecha')}</span>
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleViewModeChange('table')}
                                                                                                className={cn(
                                                                                                    'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                                                                                                    viewMode === 'table'
                                                                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
                                                                                                )}
                                                                                            >
                                                                                                <List className="h-3.5 w-3.5" />
                                                                                                <span>{__('Tabla Estándar')}</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* CONTENIDO PRINCIPAL: ACORDEÓN AGRUPADO POR FECHA O TABLA PLANA */}
                                                                                    {sales.data.length === 0 ? (
                                                                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                                                                                            <Receipt className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                                                                                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                                                                                {__('No se encontraron ventas')}
                                                                                            </h3>
                                                                                            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                                                                                {__(
                                                                                                    'No hay tickets de venta que coincidan con los filtros seleccionados o para el rango de fechas indicado.',
                                                                                                )}
                                                                                            </p>
                                                                                            {hasActiveFilters && (
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    className="mt-4"
                                                                                                    onClick={() => {
                                                                                                        setSearchTerm('');
                                                                                                        setStatusFilter('');
                                                                                                        setDateFrom('');
                                                                                                        setDateTo('');
                                                                                                    }}
                                                                                                >
                                                                                                    <X className="mr-1.5 h-4 w-4" />
                                                                                                    {__('Limpiar todos los filtros')}
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : viewMode === 'accordion' ? (
                                                                                        <div className="space-y-4">
                                                                                            {groupedSales.map((group) => {
                                                                                                const isOpen = !!openGroups[group.dateKey];

                                                                                                return (
                                                                                                    <div
                                                                                                        key={group.dateKey}
                                                                                                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs transition-all dark:border-slate-800 dark:bg-slate-900"
                                                                                                    >
                                                                                                        {/* CABECERA ACORDEÓN: FECHA Y MÉTRICAS DEL DÍA */}
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() =>
                                                                                                                toggleGroup(group.dateKey)
                                                                                                            }
                                                                                                            className="flex w-full cursor-pointer flex-col justify-between gap-3 bg-white p-4 text-left transition-colors select-none hover:bg-slate-50/80 md:flex-row md:items-center dark:bg-slate-900 dark:hover:bg-slate-800/60"
                                                                                                        >
                                                                                                            <div className="flex items-center gap-3">
                                                                                                                <div
                                                                                                                    className={cn(
                                                                                                                        'rounded-lg border p-1.5 transition-transform duration-200',
                                                                                                                        isOpen
                                                                                                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                                                                                                                            : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
                                                                                                                    )}
                                                                                                                >
                                                                                                                    <ChevronDown
                                                                                                                        className={cn(
                                                                                                                            'h-4 w-4 transition-transform duration-200',
                                                                                                                            isOpen && 'rotate-180',
                                                                                                                        )}
                                                                                                                    />
                                                                                                                </div>

                                                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-1.5 text-blue-600 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
                                                                                                                        <CalendarDays className="h-4 w-4" />
                                                                                                                    </div>
                                                                                                                    <span className="text-sm font-bold text-slate-900 md:text-base dark:text-slate-100">
                                                                                                                        {group.dateInfo.label}
                                                                                                                    </span>
                                                                                                                    {group.dateInfo.badge && (
                                                                                                                        <span
                                                                                                                            className={cn(
                                                                                                                                'rounded-full border px-2.5 py-0.5 text-xs font-bold',
                                                                                                                                group.dateInfo
                                                                                                                                    .isToday
                                                                                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                                                                                    : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
                                                                                                                            )}
                                                                                                                        >
                                                                                                                            {group.dateInfo.badge}
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </div>

                                                                                                            {/* MÉTRICAS RESUMIDAS A LA DERECHA */}
                                                                                                            <div className="flex flex-wrap items-center gap-3 pl-10 md:pl-0">
                                                                                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                                                                    <Receipt className="h-3.5 w-3.5 text-slate-500" />
                                                                                                                    <span>
                                                                                                                        {group.totalCount}{' '}
                                                                                                                        {group.totalCount === 1
                                                                                                                            ? __('venta')
                                                                                                                            : __('ventas')}
                                                                                                                    </span>
                                                                                                                </span>

                                                                                                                {group.anuladaCount > 0 && (
                                                                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
                                                                                                                        <XCircle className="h-3 w-3 text-rose-500" />
                                                                                                                        {group.anuladaCount}{' '}
                                                                                                                        {__('anulada(s)')}
                                                                                                                    </span>
                                                                                                                )}

                                                                                                                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                                                                                                                    <span className="text-xs font-medium text-muted-foreground">
                                                                                                                        {__('Total del día')}:
                                                                                                                    </span>
                                                                                                                    <span className="font-mono text-sm font-black text-emerald-600 md:text-base dark:text-emerald-400">
                                                                                                                        {currencySymbol}
                                                                                                                        {group.totalAmount.toFixed(
                                                                                                                            2,
                                                                                                                        )}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </button>

                                                                                                        {/* CUERPO DEL ACORDEÓN: TABLA DE VENTAS DEL DÍA */}
                                                                                                        {isOpen && (
                                                                                                            <div className="border-t border-slate-200 bg-slate-50/50 p-2 sm:p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                                                                                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                                                                                                    <table className="w-full text-left text-xs">
                                                                                                                        <thead className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                                                                                                                            <tr>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Ticket')}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Hora')}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Cliente')}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Vendedor')}
                                                                                                                                </th>
                                                                                                                                <th className="min-w-[200px] p-3">
                                                                                                                                    {__(
                                                                                                                                        'Artículos',
                                                                                                                                    )}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__(
                                                                                                                                        'Método Pago',
                                                                                                                                    )}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__(
                                                                                                                                        'Total Venta',
                                                                                                                                    )}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Cajero')}
                                                                                                                                </th>
                                                                                                                                <th className="p-3">
                                                                                                                                    {__('Estado')}
                                                                                                                                </th>
                                                                                                                                <th className="p-3 text-right">
                                                                                                                                    {__('Acciones')}
                                                                                                                                </th>
                                                                                                                            </tr>
                                                                                                                        </thead>
                                                                                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                                                            {group.sales.map(
                                                                                                                                (sale) => (
                                                                                                                                    <tr
                                                                                                                                        key={
                                                                                                                                            sale.id
                                                                                                                                        }
                                                                                                                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                                                                                                    >
                                                                                                                                        {/* Ticket */}
                                                                                                                                        <td className="p-3 font-mono font-bold">
                                                                                                                                            <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 font-mono text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
                                                                                                                                                {
                                                                                                                                                    sale.codigo_ticket
                                                                                                                                                }
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Hora */}
                                                                                                                                        <td className="p-3 whitespace-nowrap">
                                                                                                                                            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                                                                                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                                                                                                {formatTime(
                                                                                                                                                    sale.created_at,
                                                                                                                                                )}
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Cliente */}
                                                                                                                                        <td className="p-3">
                                                                                                                                            <span className="text-xs font-medium text-foreground">
                                                                                                                                                {sale.cliente_nombre ||
                                                                                                                                                    __(
                                                                                                                                                        'Cliente General',
                                                                                                                                                    )}
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Vendedor */}
                                                                                                                                        <td className="p-3">
                                                                                                                                            {sale.empleado ? (
                                                                                                                                                <div>
                                                                                                                                                    <span className="block text-xs font-semibold text-foreground">
                                                                                                                                                        {
                                                                                                                                                            sale
                                                                                                                                                                .empleado
                                                                                                                                                                .nombre_completo
                                                                                                                                                        }
                                                                                                                                                    </span>
                                                                                                                                                    {Number(
                                                                                                                                                        sale.comision_monto ||
                                                                                                                                                        0,
                                                                                                                                                    ) >
                                                                                                                                                        0 && (
                                                                                                                                                            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                                                                                                                +
                                                                                                                                                                {
                                                                                                                                                                    currencySymbol
                                                                                                                                                                }
                                                                                                                                                                {Number(
                                                                                                                                                                    sale.comision_monto,
                                                                                                                                                                ).toFixed(
                                                                                                                                                                    2,
                                                                                                                                                                )}{' '}
                                                                                                                                                                (
                                                                                                                                                                {Number(
                                                                                                                                                                    sale.comision_porcentaje,
                                                                                                                                                                ).toFixed(
                                                                                                                                                                    1,
                                                                                                                                                                )}
                                                                                                                                                                %)
                                                                                                                                                            </span>
                                                                                                                                                        )}
                                                                                                                                                </div>
                                                                                                                                            ) : (
                                                                                                                                                <span className="text-xs text-muted-foreground italic">
                                                                                                                                                    -
                                                                                                                                                </span>
                                                                                                                                            )}
                                                                                                                                        </td>

                                                                                                                                        {/* Artículos Preview */}
                                                                                                                                        <td className="p-3">
                                                                                                                                            {sale.items &&
                                                                                                                                                sale
                                                                                                                                                    .items
                                                                                                                                                    .length >
                                                                                                                                                0 ? (
                                                                                                                                                <div className="max-w-[240px]">
                                                                                                                                                    <span className="block text-xs font-semibold text-foreground">
                                                                                                                                                        {
                                                                                                                                                            sale
                                                                                                                                                                .items
                                                                                                                                                                .length
                                                                                                                                                        }{' '}
                                                                                                                                                        {sale
                                                                                                                                                            .items
                                                                                                                                                            .length ===
                                                                                                                                                            1
                                                                                                                                                            ? __(
                                                                                                                                                                'artículo',
                                                                                                                                                            )
                                                                                                                                                            : __(
                                                                                                                                                                'artículos',
                                                                                                                                                            )}
                                                                                                                                                    </span>
                                                                                                                                                    <span
                                                                                                                                                        className="block truncate text-[11px] text-muted-foreground"
                                                                                                                                                        title={sale.items
                                                                                                                                                            .map(
                                                                                                                                                                (
                                                                                                                                                                    i,
                                                                                                                                                                ) =>
                                                                                                                                                                    `${i.cantidad}x ${i.nombre}`,
                                                                                                                                                            )
                                                                                                                                                            .join(
                                                                                                                                                                ', ',
                                                                                                                                                            )}
                                                                                                                                                    >
                                                                                                                                                        {sale.items
                                                                                                                                                            .map(
                                                                                                                                                                (
                                                                                                                                                                    i,
                                                                                                                                                                ) =>
                                                                                                                                                                    `${i.cantidad}x ${i.nombre}`,
                                                                                                                                                            )
                                                                                                                                                            .join(
                                                                                                                                                                ', ',
                                                                                                                                                            )}
                                                                                                                                                    </span>
                                                                                                                                                </div>
                                                                                                                                            ) : (
                                                                                                                                                <span className="text-xs text-muted-foreground italic">
                                                                                                                                                    -
                                                                                                                                                </span>
                                                                                                                                            )}
                                                                                                                                        </td>

                                                                                                                                        {/* Método de Pago */}
                                                                                                                                        <td className="p-3 whitespace-nowrap">
                                                                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                                                                                                <CreditCard className="h-3 w-3 text-slate-500" />
                                                                                                                                                {sale.metodo_pago
                                                                                                                                                    ? sale.metodo_pago
                                                                                                                                                        .toUpperCase()
                                                                                                                                                        .replace(
                                                                                                                                                            '_',
                                                                                                                                                            ' ',
                                                                                                                                                        )
                                                                                                                                                    : 'EFECTIVO'}
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Total */}
                                                                                                                                        <td className="p-3 whitespace-nowrap">
                                                                                                                                            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                                                                                                                {
                                                                                                                                                    currencySymbol
                                                                                                                                                }
                                                                                                                                                {Number(
                                                                                                                                                    sale.total ||
                                                                                                                                                    0,
                                                                                                                                                ).toFixed(
                                                                                                                                                    2,
                                                                                                                                                )}
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Cajero */}
                                                                                                                                        <td className="p-3 text-xs whitespace-nowrap text-muted-foreground">
                                                                                                                                            {sale
                                                                                                                                                .user
                                                                                                                                                ?.name ||
                                                                                                                                                '-'}
                                                                                                                                        </td>

                                                                                                                                        {/* Estado */}
                                                                                                                                        <td className="p-3 whitespace-nowrap">
                                                                                                                                            <span
                                                                                                                                                className={cn(
                                                                                                                                                    'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                                                                                                                                    sale.estado ===
                                                                                                                                                        'completada'
                                                                                                                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                                                                                                                        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400',
                                                                                                                                                )}
                                                                                                                                            >
                                                                                                                                                {sale.estado ===
                                                                                                                                                    'completada'
                                                                                                                                                    ? __(
                                                                                                                                                        'Completada',
                                                                                                                                                    )
                                                                                                                                                    : __(
                                                                                                                                                        'Anulada',
                                                                                                                                                    )}
                                                                                                                                            </span>
                                                                                                                                        </td>

                                                                                                                                        {/* Acciones */}
                                                                                                                                        <td className="p-3 text-right whitespace-nowrap">
                                                                                                                                            <Button
                                                                                                                                                variant="outline"
                                                                                                                                                size="sm"
                                                                                                                                                className="h-7 gap-1 px-2.5 text-xs"
                                                                                                                                                onClick={() =>
                                                                                                                                                    setSelectedSale(
                                                                                                                                                        sale,
                                                                                                                                                    )
                                                                                                                                                }
                                                                                                                                            >
                                                                                                                                                <Eye className="h-3.5 w-3.5 text-blue-600" />
                                                                                                                                                <span>
                                                                                                                                                    {__(
                                                                                                                                                        'Ver Ticket',
                                                                                                                                                    )}
                                                                                                                                                </span>
                                                                                                                                            </Button>
                                                                                                                                        </td>
                                                                                                                                    </tr>
                                                                                                                                ),
                                                                                                                            )}
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </div>

                                                                                                                {/* RESUMEN DEL DÍA EN EL PIE DEL ACORDEÓN */}
                                                                                                                <div className="flex flex-col items-center justify-between gap-2 px-2 pt-3 text-xs text-muted-foreground sm:flex-row">
                                                                                                                    <div>
                                                                                                                        {__('Ventas completadas')}:{' '}
                                                                                                                        <strong className="text-foreground">
                                                                                                                            {group.completedCount}
                                                                                                                        </strong>{' '}
                                                                                                                        {__('de')}{' '}
                                                                                                                        <strong className="text-foreground">
                                                                                                                            {group.totalCount}
                                                                                                                        </strong>
                                                                                                                    </div>
                                                                                                                    <div className="font-semibold text-foreground">
                                                                                                                        {__(
                                                                                                                            'Recaudado neto en la fecha',
                                                                                                                        )}
                                                                                                                        :{' '}
                                                                                                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                                                                            {currencySymbol}
                                                                                                                            {group.totalAmount.toFixed(
                                                                                                                                2,
                                                                                                                            )}
                                                                                                                        </span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                );
                                                                                            })}

                                                                                            {/* PAGINACIÓN PARA MODO ACORDEÓN */}
                                                                                            <Pagination
                                                                                                paginatedData={sales}
                                                                                                filters={{
                                                                                                    search: searchTerm,
                                                                                                    status: statusFilter,
                                                                                                    perPage: perPageFilter,
                                                                                                    date_from: dateFrom,
                                                                                                    date_to: dateTo,
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        /* MODO TABLA ESTÁNDAR */
                                                                                        <DataTable
                                                                                            columns={columns}
                                                                                            data={sales}
                                                                                            filters={{
                                                                                                search: searchTerm,
                                                                                                status: statusFilter,
                                                                                                perPage: perPageFilter,
                                                                                                date_from: dateFrom,
                                                                                                date_to: dateTo,
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    {/* Dialog Detail Ticket con Estilo Corporativo FixSale */}
                                                                                    {selectedSale && (
                                                                                        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                                                                                            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                                                                                                <Dialog
                                                                                                    open={!!selectedSale}
                                                                                                    onOpenChange={() => setSelectedSale(null)}
                                                                                                >
                                                                                                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                                                                                                        <DialogHeader>
                                                                                                            <DialogTitle className="text-center flex items-center justify-center gap-2">
                                                                                                                <Receipt className="w-5 h-5 text-blue-600" />
                                                                                                                <DialogTitle className="flex items-center justify-center gap-2 text-center">
                                                                                                                    <Receipt className="h-5 w-5 text-blue-600" />
                                                                                                                    <span>{__('Detalle del Comprobante')}</span>
                                                                                                                </DialogTitle>
                                                                                                                <DialogDescription className="text-center font-mono font-bold text-xs text-foreground">
                                                                                                                    <DialogDescription className="text-center font-mono text-xs font-bold text-foreground">
                                                                                                                        {selectedSale.codigo_ticket}
                                                                                                                    </DialogDescription>
                                                                                                                </DialogHeader>

                                                                                                                {/* COMPROBANTE VISUAL TICKET */}
                                                                                                                <div className="border border-gray-300 dark:border-gray-700 bg-white text-slate-900 p-5 rounded-2xl font-sans text-xs shadow-md space-y-3">
                                                                                                                    <div className="space-y-3 rounded-2xl border border-gray-300 bg-white p-5 font-sans text-xs text-slate-900 shadow-md dark:border-gray-700">
                                                                                                                        {/* LOGO & BUSINESS HEADER */}
                                                                                                                        <div className="text-center space-y-1">
                                                                                                                            <div className="space-y-1 text-center">
                                                                                                                                <div className="flex items-center justify-center gap-2">
                                                                                                                                    {empresa?.logo ? (
                                                                                                                                        <img
                                                                                                                                            src={empresa.logo}
                                                                                                                                            alt={empresa.razon_social || 'Logo Empresa'}
                                                                                                                                            alt={
                                                                                                                                                empresa.razon_social ||
                                                                                                                                                'Logo Empresa'
                                                                                                                                            }
                                                                                                                                            className="h-12 max-w-[180px] object-contain drop-shadow-sm"
                                                                                                                                        />
                                                                                                                                    ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">
                                                    FS
                                                </div>
                                                <span className="text-2xl font-black tracking-tight text-slate-900">
                                                    Fix<span className="text-[#FF5722]">Sale</span>
                                                    Fix
                                                    <span className="text-[#FF5722]">
                                                        Sale
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 uppercase">
                                        {empresa?.razon_social || 'Servitec POS & Servicios'}
                                        {empresa?.razon_social ||
                                            'Servitec POS & Servicios'}
                                    </div>
                                    {empresa?.documento && (
                                        <div className="text-[11px] font-mono text-slate-600">
                                        <div className="font-mono text-[11px] text-slate-600">
                                            {empresa.documento}
                                        </div>
                                    )}
                                    <div className="text-[11px] text-slate-500">
                                        {empresa?.telefono ? `Tel: ${empresa.telefono}` : 'Tel: +58 (0414) 123-4567'}
                                        {empresa?.email ? ` | ${empresa.email}` : ''}
                                        {empresa?.telefono
                                            ? `Tel: ${empresa.telefono}`
                                            : 'Tel: +58 (0414) 123-4567'}
                                        {empresa?.email
                                            ? ` | ${empresa.email}`
                                            : ''}
                                    </div>
                                    {empresa?.direccion && (
                                        <div className="text-[10px] text-slate-400 italic">
                                            {empresa.direccion}
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-dashed border-gray-300 my-2"></div>
                                <div className="my-2 border-b border-dashed border-gray-300"></div>

                                {/* TITLE & METADATA */}
                                                                                                                                    <div className="text-center font-extrabold text-slate-800 text-sm tracking-wide uppercase">
                                                                                                                                        <div className="text-center text-sm font-extrabold tracking-wide text-slate-800 uppercase">
                                                                                                                                            COMPROBANTE DE VENTA
                                                                                                                                        </div>

                                                                                                                                        <div className="grid grid-cols-2 text-[11px] gap-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg font-mono">
                                                                                                                                            <div><strong>N° Ticket:</strong> {selectedSale.codigo_ticket}</div>
                                                                                                                                            <div className="text-right"><strong>Fecha:</strong> {new Date(selectedSale.created_at).toLocaleDateString()}</div>
                                                                                                                                            <div><strong>Cliente:</strong> {selectedSale.cliente_nombre || 'Cliente General'}</div>
                                                                                                                                            <div className="text-right"><strong>Atendido por:</strong> {selectedSale.user?.name || 'Cajero POS'}</div>
                                                                                                                                            <div className="grid grid-cols-2 gap-y-1 rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600">
                                                                                                                                                <div>
                                                                                                                                                    <strong>N° Ticket:</strong>{' '}
                                                                                                                                                    {selectedSale.codigo_ticket}
                                                                                                                                                </div>
                                                                                                                                                <div className="text-right">
                                                                                                                                                    <strong>Fecha:</strong>{' '}
                                                                                                                                                    {new Date(
                                                                                                                                                        selectedSale.created_at,
                                                                                                                                                    ).toLocaleDateString()}
                                                                                                                                                </div>
                                                                                                                                                <div>
                                                                                                                                                    <strong>Cliente:</strong>{' '}
                                                                                                                                                    {selectedSale.cliente_nombre ||
                                                                                                                                                        'Cliente General'}
                                                                                                                                                </div>
                                                                                                                                                <div className="text-right">
                                                                                                                                                    <strong>Atendido por:</strong>{' '}
                                                                                                                                                    {selectedSale.user?.name ||
                                                                                                                                                        'Cajero POS'}
                                                                                                                                                </div>
                                                                                                                                                {selectedSale.empleado && (
                                                                                                                                                    <div className="col-span-2 pt-1 border-t border-dashed text-emerald-700 dark:text-emerald-400">
                                                                                                                                                        <strong>Vendedor:</strong> {selectedSale.empleado.nombre_completo}
                                                                                                                                                        {Number(selectedSale.comision_monto || 0) > 0 && ` (+${currencySymbol}${Number(selectedSale.comision_monto).toFixed(2)})`}
                                                                                                                                                        <div className="col-span-2 border-t border-dashed pt-1 text-emerald-700 dark:text-emerald-400">
                                                                                                                                                            <strong>Vendedor:</strong>{' '}
                                                                                                                                                            {
                                                                                                                                                                selectedSale.empleado
                                                                                                                                                                    .nombre_completo
                                                                                                                                                            }
                                                                                                                                                            {Number(
                                                                                                                                                                selectedSale.comision_monto ||
                                                                                                                                                                0,
                                                                                                                                                            ) > 0 &&
                                                                                                                                                                ` (+${currencySymbol}${Number(selectedSale.comision_monto).toFixed(2)})`}
                                                                                                                                                        </div>
                                    )}
                                                                                                                                                    </div>

                                {/* ITEMS TABLE */}
                                                                                                                                                <div className="space-y-1 my-2">
                                                                                                                                                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 p-1.5 rounded">
                                                                                                                                                        <div className="my-2 space-y-1">
                                                                                                                                                            <div className="grid grid-cols-12 rounded bg-slate-100 p-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                                                                                                                                                <span className="col-span-1">#</span>
                                                                                                                                                                <span className="col-span-5">CONCEPTO</span>
                                                                                                                                                                <span className="col-span-2 text-center">CANT</span>
                                                                                                                                                                <span className="col-span-2 text-right">P.U.</span>
                                                                                                                                                                <span className="col-span-2 text-right">TOTAL</span>
                                                                                                                                                                <span className="col-span-5">
                                                                                                                                                                    CONCEPTO
                                                                                                                                                                </span>
                                                                                                                                                                <span className="col-span-2 text-center">
                                                                                                                                                                    CANT
                                                                                                                                                                </span>
                                                                                                                                                                <span className="col-span-2 text-right">
                                                                                                                                                                    P.U.
                                                                                                                                                                </span>
                                                                                                                                                                <span className="col-span-2 text-right">
                                                                                                                                                                    TOTAL
                                                                                                                                                                </span>
                                                                                                                                                            </div>
                                                                                                                                                            {selectedSale.items?.map((item, idx) => (
                                                                                                                                                                <div key={item.id} className="grid grid-cols-12 text-[11px] py-1.5 border-b border-gray-100 items-center">
                                                                                                                                                                    <span className="col-span-1 text-slate-400 font-mono text-[10px]">{idx + 1}</span>
                                                                                                                                                                    <span className="col-span-5 font-medium truncate text-slate-800">{item.nombre}</span>
                                                                                                                                                                    <span className="col-span-2 text-center font-mono text-slate-600">{item.cantidad} {item.cantidad > 1 ? 'pcs' : 'pc'}</span>
                                                                                                                                                                    <span className="col-span-2 text-right font-mono text-slate-600">${Number(item.precio_unitario).toFixed(2)}</span>
                                                                                                                                                                    <span className="col-span-2 text-right font-mono font-bold text-slate-900">${Number(item.subtotal).toFixed(2)}</span>
                                                                                                                                                                    <div
                                                                                                                                                                        key={item.id}
                                                                                                                                                                        className="grid grid-cols-12 items-center border-b border-gray-100 py-1.5 text-[11px]"
                                                                                                                                                                    >
                                                                                                                                                                        <span className="col-span-1 font-mono text-[10px] text-slate-400">
                                                                                                                                                                            {idx + 1}
                                                                                                                                                                        </span>
                                                                                                                                                                        <span className="col-span-5 truncate font-medium text-slate-800">
                                                                                                                                                                            {item.nombre}
                                                                                                                                                                        </span>
                                                                                                                                                                        <span className="col-span-2 text-center font-mono text-slate-600">
                                                                                                                                                                            {item.cantidad}{' '}
                                                                                                                                                                            {item.cantidad > 1
                                                                                                                                                                                ? 'pcs'
                                                                                                                                                                                : 'pc'}
                                                                                                                                                                        </span>
                                                                                                                                                                        <span className="col-span-2 text-right font-mono text-slate-600">
                                                                                                                                                                            $
                                                                                                                                                                            {Number(
                                                                                                                                                                                item.precio_unitario,
                                                                                                                                                                            ).toFixed(2)}
                                                                                                                                                                        </span>
                                                                                                                                                                        <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                                                                                                                                                                            $
                                                                                                                                                                            {Number(item.subtotal).toFixed(
                                                                                                                                                                                2,
                                                                                                                                                                            )}
                                                                                                                                                                        </span>
                                                                                                                                                                    </div>
                                    ))}
                                                                                                                                                                </div>

                                {/* SUMMARY TOTALS */ }
                                                                                                                                                                < div className = "space-y-1 text-xs pt-1" >
                                                                                                                                                                <div className="space-y-1 pt-1 text-xs">
                                                                                                                                                                    <div className="flex justify-between text-slate-600">
                                                                                                                                                                        <span>Subtotal Items ({selectedSale.items?.length || 0}):</span>
                                                                                                                                                                        <span className="font-mono font-medium">${Number(selectedSale.subtotal || selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                        <span>
                                                                                                                                                                            Subtotal Items (
                                                                                                                                                                            {selectedSale.items?.length || 0}):
                                                                                                                                                                        </span>
                                                                                                                                                                        <span className="font-mono font-medium">
                                                                                                                                                                            $
                                                                                                                                                                            {Number(
                                                                                                                                                                                selectedSale.subtotal ||
                                                                                                                                                                                selectedSale.total,
                                                                                                                                                                            ).toFixed(2)}
                                                                                                                                                                        </span>
                                                                                                                                                                    </div>
                                                                                                                                                                    {Number(selectedSale.descuento || 0) > 0 && (
                                                                                                                                                                        <div className="flex justify-between text-rose-600 font-medium">
                                                                                                                                                                            {Number(selectedSale.descuento || 0) >
                                                                                                                                                                                0 && (
                                                                                                                                                                                    <div className="flex justify-between font-medium text-rose-600">
                                                                                                                                                                                        <span>Descuento Aplicado:</span>
                                                                                                                                                                                        <span className="font-mono">-${Number(selectedSale.descuento).toFixed(2)}</span>
                                                                                                                                                                                        <span className="font-mono">
                                                                                                                                                                                            -$
                                                                                                                                                                                            {Number(
                                                                                                                                                                                                selectedSale.descuento,
                                                                                                                                                                                            ).toFixed(2)}
                                                                                                                                                                                        </span>
                                                                                                                                                                                    </div>
                                                                                                                                                                                )}
                                                                                                                                                                            <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-1 text-slate-900">
                                                                                                                                                                                <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-base font-black text-slate-900">
                                                                                                                                                                                    <span>TOTAL A PAGAR:</span>
                                                                                                                                                                                    <span className="font-mono text-emerald-600">{currencySymbol}{Number(selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                                    <span className="font-mono text-emerald-600">
                                                                                                                                                                                        {currencySymbol}
                                                                                                                                                                                        {Number(selectedSale.total).toFixed(
                                                                                                                                                                                            2,
                                                                                                                                                                                        )}
                                                                                                                                                                                    </span>
                                                                                                                                                                                </div>
                                                                                                                                                                            </div>

                                                                                                                                                                            {/* PAYMENT SUMMARY BOX */}
                                                                                                                                                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs font-mono">
                                                                                                                                                                                <div className="flex justify-between text-slate-600 font-bold border-b border-slate-200 pb-1">
                                                                                                                                                                                    <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs">
                                                                                                                                                                                        <div className="flex justify-between border-b border-slate-200 pb-1 font-bold text-slate-600">
                                                                                                                                                                                            <span>MONTO PAGADO</span>
                                                                                                                                                                                            <span>MÉTODO DE PAGO</span>
                                                                                                                                                                                        </div>
                                                                                                                                                                                        <div className="flex justify-between font-bold text-sm text-slate-800 pt-0.5">
                                                                                                                                                                                            <span>${Number(selectedSale.monto_recibido || selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                                            <span className="text-blue-600 uppercase">{selectedSale.metodo_pago}</span>
                                                                                                                                                                                            <div className="flex justify-between pt-0.5 text-sm font-bold text-slate-800">
                                                                                                                                                                                                <span>
                                                                                                                                                                                                    $
                                                                                                                                                                                                    {Number(
                                                                                                                                                                                                        selectedSale.monto_recibido ||
                                                                                                                                                                                                        selectedSale.total,
                                                                                                                                                                                                    ).toFixed(2)}
                                                                                                                                                                                                </span>
                                                                                                                                                                                                <span className="text-blue-600 uppercase">
                                                                                                                                                                                                    {selectedSale.metodo_pago}
                                                                                                                                                                                                </span>
                                                                                                                                                                                            </div>
                                                                                                                                                                                            {Number(selectedSale.cambio || 0) > 0 && (
                                                                                                                                                                                                <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200 mt-1">
                                                                                                                                                                                                    <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500">
                                                                                                                                                                                                        <span>Cambio Entregado:</span>
                                                                                                                                                                                                        <span className="font-bold text-slate-700">${Number(selectedSale.cambio).toFixed(2)}</span>
                                                                                                                                                                                                        <span className="font-bold text-slate-700">
                                                                                                                                                                                                            $
                                                                                                                                                                                                            {Number(
                                                                                                                                                                                                                selectedSale.cambio,
                                                                                                                                                                                                            ).toFixed(2)}
                                                                                                                                                                                                        </span>
                                                                                                                                                                                                    </div>
                                    )}
                                                                                                                                                                                                </div>

                                {/* CÓDIGO QR PARA VALIDACIÓN */}
                                                                                                                                                                                            <div className="pt-2 flex flex-col items-center justify-center space-y-2 border-t border-dashed border-gray-300">
                                                                                                                                                                                                {renderTicketQRCode(selectedSale.codigo_ticket, Number(selectedSale.total))}
                                                                                                                                                                                                <div className="flex flex-col items-center justify-center space-y-2 border-t border-dashed border-gray-300 pt-2">
                                                                                                                                                                                                    {renderTicketQRCode(
                                                                                                                                                                                                        selectedSale.codigo_ticket,
                                                                                                                                                                                                        Number(selectedSale.total),
                                                                                                                                                                                                    )}
                                                                                                                                                                                                </div>

                                                                                                                                                                                                <div className="border-b border-dashed border-gray-300 my-2"></div>
                                                                                                                                                                                                <div className="my-2 border-b border-dashed border-gray-300"></div>
                                                                                                                                                                                                <div className="text-center text-xs font-bold text-slate-700 uppercase">
                                                                                                                                                                                                    ¡GRACIAS POR SU COMPRA!
                                                                                                                                                                                                </div>
                                                                                                                                                                                                <div className="text-center text-[10px] text-slate-400">
                                                                                                                                                                                                    {empresa?.razon_social || 'Servitec POS'} - Comprobante de Venta
                                                                                                                                                                                                    {empresa?.razon_social || 'Servitec POS'} -
                                                                                                                                                                                                    Comprobante de Venta
                                                                                                                                                                                                </div>
                                                                                                                                                                                            </div>

                                                                                                                                                                                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                                                                                                                                                                                <Button variant="outline" className="w-full font-bold gap-1.5" onClick={() => window.print()}>
                                                                                                                                                                                                    <Printer className="w-4 h-4 text-blue-600" />
                                                                                                                                                                                                    <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row">
                                                                                                                                                                                                        <Button
                                                                                                                                                                                                            variant="outline"
                                                                                                                                                                                                            className="w-full gap-1.5 font-bold"
                                                                                                                                                                                                            onClick={() => window.print()}
                                                                                                                                                                                                        >
                                                                                                                                                                                                            <Printer className="h-4 w-4 text-blue-600" />
                                                                                                                                                                                                            {__('Imprimir Comprobante')}
                                                                                                                                                                                                        </Button>
                                                                                                                                                                                                        <Button variant="secondary" className="w-full font-bold" onClick={() => setSelectedSale(null)}>
                                                                                                                                                                                                            <Button
                                                                                                                                                                                                                variant="secondary"
                                                                                                                                                                                                                className="w-full font-bold"
                                                                                                                                                                                                                onClick={() => setSelectedSale(null)}
                                                                                                                                                                                                            >
                                                                                                                                                                                                                {__('Cerrar')}
                                                                                                                                                                                                            </Button>
                                                                                                                                                                                                    </DialogFooter>
                                                                                                                                                                                                </DialogContent>
                                                                                                                                                                                            </Dialog>
                )}

                                                                                                                                                                                            {/* PLANTILLA DE IMPRESIÓN OFICIAL TICKET 80MM (ADMIN/VENTAS) */}
                                                                                                                                                                                            {selectedSale && (
                                                                                                                                                                                                <div id="printable-ticket-admin" className="hidden print:block text-black bg-white font-sans p-4 text-xs w-[80mm] max-w-[80mm] mx-auto">
                                                                                                                                                                                                    <div
                                                                                                                                                                                                        id="printable-ticket-admin"
                                                                                                                                                                                                        className="mx-auto hidden w-[80mm] max-w-[80mm] bg-white p-4 font-sans text-xs text-black print:block"
                                                                                                                                                                                                    >
                                                                                                                                                                                                        <style>{`
                            @media print {
                                body * {
                                    visibility: hidden !important;
                                }
                                #printable-ticket-admin, #printable-ticket-admin * {
                                    visibility: visible !important;
                                }
                                #printable-ticket-admin {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 80mm !important;
                                    max-width: 80mm !important;
                                    margin: 0 !important;
                                    padding: 4mm !important;
                                    background: white !important;
                                    color: black !important;
                                    font-family: Arial, sans-serif !important;
                                    font-size: 11px !important;
                                }
                                @page {
                                    size: 80mm auto;
                                    margin: 0;
                                }
                            }
                        `}</style>

                                                                                                                                                                                                        {/* LOGO DE LA EMPRESA O MARCA */}
                                                                                                                                                                                                        <div className="text-center mb-1">
                                                                                                                                                                                                            <div className="mb-1 text-center">
                                                                                                                                                                                                                {empresa?.logo ? (
                                                                                                                                                                                                                    <img
                                                                                                                                                                                                                        src={empresa.logo}
                                                                                                                                                                                                                        alt={empresa.razon_social || 'Logo'}
                                                                                                                                                                                                                        className="h-10 max-w-[160px] mx-auto object-contain"
                                                                                                                                                                                                                        className="mx-auto h-10 max-w-[160px] object-contain"
                                                                                                                                                                                                                    />
                                                                                                                                                                                                                ) : (
                                <div className="font-black text-base uppercase">{empresa?.razon_social || 'FixSale - Servitec POS'}</div>
                                <div className="text-base font-black uppercase">
                                    {empresa?.razon_social ||
                                        'FixSale - Servitec POS'}
                                </div>
                                                                                                                                                                                                                )}
                                                                                                                                                                                                            </div>

                                                                                                                                                                                                            {empresa?.razon_social && (
                            <div className="text-center font-bold text-xs uppercase">{empresa.razon_social}</div>
                            <div className="text-center text-xs font-bold uppercase">
                                {empresa.razon_social}
                            </div>
                                                                                                                                                                                                            )}
                                                                                                                                                                                                            {empresa?.documento && (
                            <div className="text-center text-[9px] font-mono">{empresa.documento}</div>
                            <div className="text-center font-mono text-[9px]">
                                {empresa.documento}
                            </div>
                                                                                                                                                                                                            )}
                                                                                                                                                                                                            <div className="text-center text-[9px] text-gray-700">
                                                                                                                                                                                                                {empresa?.telefono ? `Tel: ${empresa.telefono}` : ''} {empresa?.email ? `| ${empresa.email}` : ''}
                                                                                                                                                                                                                {empresa?.telefono
                                                                                                                                                                                                                    ? `Tel: ${empresa.telefono}`
                                                                                                                                                                                                                    : ''}{' '}
                                                                                                                                                                                                                {empresa?.email ? `| ${empresa.email}` : ''}
                                                                                                                                                                                                            </div>
                                                                                                                                                                                                            {empresa?.direccion && (
                            <div className="text-center text-[8px] text-gray-600">{empresa.direccion}</div>
                            <div className="text-center text-[8px] text-gray-600">
                                {empresa.direccion}
                            </div>
                                                                                                                                                                                                            )}

                                                                                                                                                                                                            <div className="border-b border-dashed border-black my-1"></div>
                                                                                                                                                                                                            <div className="text-center font-bold uppercase text-[10px]">COMPROBANTE DE VENTA</div>
                                                                                                                                                                                                            <div className="flex justify-between text-[10px] font-mono mt-1">
                                                                                                                                                                                                                <div className="my-1 border-b border-dashed border-black"></div>
                                                                                                                                                                                                                <div className="text-center text-[10px] font-bold uppercase">
                                                                                                                                                                                                                    COMPROBANTE DE VENTA
                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                <div className="mt-1 flex justify-between font-mono text-[10px]">
                                                                                                                                                                                                                    <span>TICKET: {selectedSale.codigo_ticket}</span>
                                                                                                                                                                                                                    <span>{new Date(selectedSale.created_at).toLocaleDateString()}</span>
                                                                                                                                                                                                                    <span>
                                                                                                                                                                                                                        {new Date(
                                                                                                                                                                                                                            selectedSale.created_at,
                                                                                                                                                                                                                        ).toLocaleDateString()}
                                                                                                                                                                                                                    </span>
                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                <div className="text-[10px]">CLIENTE: {selectedSale.cliente_nombre || 'Cliente General'}</div>
                                                                                                                                                                                                                <div className="text-[10px]">ATENDIÓ: {selectedSale.user?.name || 'Cajero POS'}</div>
                                                                                                                                                                                                                <div className="text-[10px]">
                                                                                                                                                                                                                    CLIENTE:{' '}
                                                                                                                                                                                                                    {selectedSale.cliente_nombre || 'Cliente General'}
                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                <div className="text-[10px]">
                                                                                                                                                                                                                    ATENDIÓ: {selectedSale.user?.name || 'Cajero POS'}
                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                {selectedSale.empleado && (
                            <div className="text-[10px] font-bold">VENDEDOR: {selectedSale.empleado.nombre_completo}</div>
                            <div className="text-[10px] font-bold">
                                VENDEDOR:{' '}
                                {selectedSale.empleado.nombre_completo}
                            </div>
                                                                                                                                                                                                                )}
                                                                                                                                                                                                                <div className="border-b border-dashed border-black my-1"></div>
                                                                                                                                                                                                                <div className="my-1 border-b border-dashed border-black"></div>

                                                                                                                                                                                                                {/* Encabezado Tabla */}
                                                                                                                                                                                                                <div className="grid grid-cols-12 text-[10px] font-bold border-b border-black pb-0.5">
                                                                                                                                                                                                                    <div className="grid grid-cols-12 border-b border-black pb-0.5 text-[10px] font-bold">
                                                                                                                                                                                                                        <span className="col-span-1">#</span>
                                                                                                                                                                                                                        <span className="col-span-5">DESCRIPCIÓN</span>
                                                                                                                                                                                                                        <span className="col-span-2 text-center">CANT</span>
                                                                                                                                                                                                                        <span className="col-span-2 text-right">P.U.</span>
                                                                                                                                                                                                                        <span className="col-span-2 text-right">TOTAL</span>
                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                    {/* Items */}
                                                                                                                                                                                                                    {selectedSale.items?.map((item, idx) => (
                                                                                                                                                                                                                        <div key={item.id} className="grid grid-cols-12 text-[10px] py-0.5 border-b border-dotted border-gray-400">
                                                                                                                                                                                                                            <div
                                                                                                                                                                                                                                key={item.id}
                                                                                                                                                                                                                                className="grid grid-cols-12 border-b border-dotted border-gray-400 py-0.5 text-[10px]"
                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                <span className="col-span-1">{idx + 1}</span>
                                                                                                                                                                                                                                <span className="col-span-5 truncate">{item.nombre}</span>
                                                                                                                                                                                                                                <span className="col-span-2 text-center">{item.cantidad}</span>
                                                                                                                                                                                                                                <span className="col-span-2 text-right">${Number(item.precio_unitario).toFixed(2)}</span>
                                                                                                                                                                                                                                <span className="col-span-2 text-right font-bold">${Number(item.subtotal ?? (item.cantidad * item.precio_unitario) ?? 0).toFixed(2)}</span>
                                                                                                                                                                                                                                <span className="col-span-5 truncate">
                                                                                                                                                                                                                                    {item.nombre}
                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                <span className="col-span-2 text-center">
                                                                                                                                                                                                                                    {item.cantidad}
                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                <span className="col-span-2 text-right">
                                                                                                                                                                                                                                    ${Number(item.precio_unitario).toFixed(2)}
                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                <span className="col-span-2 text-right font-bold">
                                                                                                                                                                                                                                    $
                                                                                                                                                                                                                                    {Number(
                                                                                                                                                                                                                                        item.subtotal ??
                                                                                                                                                                                                                                        item.cantidad *
                                                                                                                                                                                                                                        item.precio_unitario ??
                                                                                                                                                                                                                                        0,
                                                                                                                                                                                                                                    ).toFixed(2)}
                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                            </div>
                        ))}

                                                                                                                                                                                                                            <div className="border-b border-dashed border-black my-1"></div>
                                                                                                                                                                                                                            <div className="my-1 border-b border-dashed border-black"></div>

                                                                                                                                                                                                                            {/* Totales */}
                                                                                                                                                                                                                            <div className="space-y-0.5 text-[10px]">
                                                                                                                                                                                                                                <div className="flex justify-between">
                                                                                                                                                                                                                                    <span>SUBTOTAL:</span>
                                                                                                                                                                                                                                    <span>${Number(selectedSale.subtotal || selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                                                                                    <span>
                                                                                                                                                                                                                                        $
                                                                                                                                                                                                                                        {Number(
                                                                                                                                                                                                                                            selectedSale.subtotal ||
                                                                                                                                                                                                                                            selectedSale.total,
                                                                                                                                                                                                                                        ).toFixed(2)}
                                                                                                                                                                                                                                    </span>
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                {Number(selectedSale.descuento || 0) > 0 && (
                                                                                                                                                                                                                                    <div className="flex justify-between">
                                                                                                                                                                                                                                        <span>DESCUENTO:</span>
                                                                                                                                                                                                                                        <span>-${Number(selectedSale.descuento).toFixed(2)}</span>
                                                                                                                                                                                                                                        <span>
                                                                                                                                                                                                                                            -$
                                                                                                                                                                                                                                            {Number(selectedSale.descuento).toFixed(
                                                                                                                                                                                                                                                2,
                                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                <div className="flex justify-between text-xs font-bold border-t border-b border-black py-0.5">
                                                                                                                                                                                                                                    <div className="flex justify-between border-t border-b border-black py-0.5 text-xs font-bold">
                                                                                                                                                                                                                                        <span>TOTAL A PAGAR:</span>
                                                                                                                                                                                                                                        <span>{currencySymbol}{Number(selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                                                                                        <span>
                                                                                                                                                                                                                                            {currencySymbol}
                                                                                                                                                                                                                                            {Number(selectedSale.total).toFixed(2)}
                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                </div>

                                                                                                                                                                                                                                <div className="border-b border-dashed border-black my-1"></div>
                                                                                                                                                                                                                                <div className="my-1 border-b border-dashed border-black"></div>

                                                                                                                                                                                                                                {/* Métodos de Pago */}
                                                                                                                                                                                                                                <div className="text-[10px] space-y-0.5">
                                                                                                                                                                                                                                    <div className="font-bold">PAGADO CON ({selectedSale.metodo_pago.toUpperCase()}):</div>
                                                                                                                                                                                                                                    <div className="space-y-0.5 text-[10px]">
                                                                                                                                                                                                                                        <div className="font-bold">
                                                                                                                                                                                                                                            PAGADO CON (
                                                                                                                                                                                                                                            {selectedSale.metodo_pago.toUpperCase()}):
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                        <div className="flex justify-between">
                                                                                                                                                                                                                                            <span>RECIBIDO:</span>
                                                                                                                                                                                                                                            <span>${Number(selectedSale.monto_recibido || selectedSale.total).toFixed(2)}</span>
                                                                                                                                                                                                                                            <span>
                                                                                                                                                                                                                                                $
                                                                                                                                                                                                                                                {Number(
                                                                                                                                                                                                                                                    selectedSale.monto_recibido ||
                                                                                                                                                                                                                                                    selectedSale.total,
                                                                                                                                                                                                                                                ).toFixed(2)}
                                                                                                                                                                                                                                            </span>
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                        {Number(selectedSale.cambio || 0) > 0 && (
                                                                                                                                                                                                                                            <div className="flex justify-between font-bold">
                                                                                                                                                                                                                                                <span>CAMBIO:</span>
                                                                                                                                                                                                                                                <span>${Number(selectedSale.cambio).toFixed(2)}</span>
                                                                                                                                                                                                                                                <span>
                                                                                                                                                                                                                                                    $
                                                                                                                                                                                                                                                    {Number(selectedSale.cambio).toFixed(2)}
                                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                        )}
                                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                                    {/* CÓDIGO QR PARA VALIDACIÓN */}
                                                                                                                                                                                                                                    <div className="text-center pt-2 pb-1 flex flex-col items-center">
                                                                                                                                                                                                                                        <div className="flex flex-col items-center pt-2 pb-1 text-center">
                                                                                                                                                                                                                                            <QRCodeSVG
                                                                                                                                                                                                                                                value={`TICKET:${selectedSale.codigo_ticket}|TOTAL:${selectedSale.total}`}
                                                                                                                                                                                                                                                size={100}
                                                                                                                                                                                                                                            />
                                                                                                                                                                                                                                            <div className="text-[8px] font-mono text-gray-600 mt-0.5">ESCANEAR PARA VALIDAR</div>
                                                                                                                                                                                                                                            <div className="mt-0.5 font-mono text-[8px] text-gray-600">
                                                                                                                                                                                                                                                ESCANEAR PARA VALIDAR
                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                        <div className="border-b border-dashed border-black my-1"></div>
                                                                                                                                                                                                                                        <div className="text-center text-[10px] font-bold uppercase">¡GRACIAS POR SU COMPRA!</div>
                                                                                                                                                                                                                                        <div className="text-center text-[9px] text-gray-600">{empresa?.razon_social || 'Servitec POS'} - Comprobante de Venta</div>
                                                                                                                                                                                                                                        <div className="my-1 border-b border-dashed border-black"></div>
                                                                                                                                                                                                                                        <div className="text-center text-[10px] font-bold uppercase">
                                                                                                                                                                                                                                            ¡GRACIAS POR SU COMPRA!
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                        <div className="text-center text-[9px] text-gray-600">
                                                                                                                                                                                                                                            {empresa?.razon_social || 'Servitec POS'} -
                                                                                                                                                                                                                                            Comprobante de Venta
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                    </div>
                )}
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                            </>
                                                                                                                                                                                                                            );
}
