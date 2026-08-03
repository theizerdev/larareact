import { Head, router } from '@inertiajs/react';
import { ShoppingCart, Receipt, CheckCircle, Eye, CreditCard, DollarSign, Calendar, User, Printer } from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    };
}

export default function Index({ sales, currencySymbol = '$', empresa, filters }: Props) {
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
    };

    // Filters
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '10');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                window.location.pathname,
                cleanParams({ search: searchTerm, status: statusFilter, perPage: perPageFilter }),
                { preserveState: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, perPageFilter]);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Historial de Ventas'), href: '/admin/ventas' },
    ];

    const columns: ColumnDef<Sale>[] = [
        {
            header: __('Ticket'),
            accessorKey: 'codigo_ticket',
            cell: (sale) => (
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
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
                </span>
            ),
        },
        {
            header: __('Total Venta'),
            accessorKey: 'total',
            cell: (sale) => (
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{Number(sale.total || 0).toFixed(2)}
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

    return (
        <>
            <Head title={__('Historial de Ventas - POS')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Receipt className="h-6 w-6 text-white" />}
                    title={__('Historial de Ventas')}
                    description={__('Consulta y revisa todos los tickets de venta emitidos en el Punto de Venta.')}
                    colorClassName="bg-indigo-600"
                >
                    <Button onClick={() => router.get('/admin/ventas/terminal')}>
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
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Buscar por N° ticket, cliente...')}
                                className="w-full md:w-96"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>
                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{__('Todos')}</SelectItem>
                                    <SelectItem value="completada">{__('Completada')}</SelectItem>
                                    <SelectItem value="anulada">{__('Anulada')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                        <FilterField label={__('Registros por página')}>
                            <Select value={perPageFilter} onValueChange={setPerPageFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                <DataTable
                    columns={columns}
                    data={sales}
                />

                {/* Dialog Detail Ticket con Estilo Corporativo FixSale */}
                {selectedSale && (
                    <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-center flex items-center justify-center gap-2">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                    <span>{__('Detalle del Comprobante')}</span>
                                </DialogTitle>
                                <DialogDescription className="text-center font-mono font-bold text-xs text-foreground">
                                    {selectedSale.codigo_ticket}
                                </DialogDescription>
                            </DialogHeader>

                            {/* COMPROBANTE VISUAL TICKET */}
                            <div className="border border-gray-300 dark:border-gray-700 bg-white text-slate-900 p-5 rounded-2xl font-sans text-xs shadow-md space-y-3">
                                {/* LOGO & BUSINESS HEADER */}
                                <div className="text-center space-y-1">
                                    <div className="flex items-center justify-center gap-2">
                                        {empresa?.logo ? (
                                            <img
                                                src={empresa.logo}
                                                alt={empresa.razon_social || 'Logo Empresa'}
                                                className="h-12 max-w-[180px] object-contain drop-shadow-sm"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                                                    FS
                                                </div>
                                                <span className="text-2xl font-black tracking-tight text-slate-900">
                                                    Fix<span className="text-[#FF5722]">Sale</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 uppercase">
                                        {empresa?.razon_social || 'Servitec POS & Servicios'}
                                    </div>
                                    {empresa?.documento && (
                                        <div className="text-[11px] font-mono text-slate-600">
                                            RIF / Doc: {empresa.documento}
                                        </div>
                                    )}
                                    <div className="text-[11px] text-slate-500">
                                        {empresa?.telefono ? `Tel: ${empresa.telefono}` : 'Tel: +58 (0414) 123-4567'}
                                        {empresa?.email ? ` | ${empresa.email}` : ''}
                                    </div>
                                    {empresa?.direccion && (
                                        <div className="text-[10px] text-slate-400 italic">
                                            {empresa.direccion}
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-dashed border-gray-300 my-2"></div>

                                {/* TITLE & METADATA */}
                                <div className="text-center font-extrabold text-slate-800 text-sm tracking-wide uppercase">
                                    COMPROBANTE DE VENTA (80MM)
                                </div>

                                <div className="grid grid-cols-2 text-[11px] gap-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg font-mono">
                                    <div><strong>N° Ticket:</strong> {selectedSale.codigo_ticket}</div>
                                    <div className="text-right"><strong>Fecha:</strong> {new Date(selectedSale.created_at).toLocaleDateString()}</div>
                                    <div><strong>Cliente:</strong> {selectedSale.cliente_nombre || 'Cliente General'}</div>
                                    <div className="text-right"><strong>Atendido por:</strong> {selectedSale.user?.name || 'Cajero POS'}</div>
                                </div>

                                {/* ITEMS TABLE */}
                                <div className="space-y-1 my-2">
                                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 p-1.5 rounded">
                                        <span className="col-span-1">#</span>
                                        <span className="col-span-5">CONCEPTO</span>
                                        <span className="col-span-2 text-center">CANT</span>
                                        <span className="col-span-2 text-right">P.U.</span>
                                        <span className="col-span-2 text-right">TOTAL</span>
                                    </div>
                                    {selectedSale.items?.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 text-[11px] py-1.5 border-b border-gray-100 items-center">
                                            <span className="col-span-1 text-slate-400 font-mono text-[10px]">{idx + 1}</span>
                                            <span className="col-span-5 font-medium truncate text-slate-800">{item.nombre}</span>
                                            <span className="col-span-2 text-center font-mono text-slate-600">{item.cantidad} {item.cantidad > 1 ? 'pcs' : 'pc'}</span>
                                            <span className="col-span-2 text-right font-mono text-slate-600">${Number(item.precio_unitario).toFixed(2)}</span>
                                            <span className="col-span-2 text-right font-mono font-bold text-slate-900">${Number(item.subtotal).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* SUMMARY TOTALS */}
                                <div className="space-y-1 text-xs pt-1">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal Items ({selectedSale.items?.length || 0}):</span>
                                        <span className="font-mono font-medium">${Number(selectedSale.subtotal || selectedSale.total).toFixed(2)}</span>
                                    </div>
                                    {Number(selectedSale.descuento || 0) > 0 && (
                                        <div className="flex justify-between text-rose-600 font-medium">
                                            <span>Descuento Aplicado:</span>
                                            <span className="font-mono">-${Number(selectedSale.descuento).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-1 text-slate-900">
                                        <span>TOTAL A PAGAR:</span>
                                        <span className="font-mono text-emerald-600">{currencySymbol}{Number(selectedSale.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* PAYMENT SUMMARY BOX */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs font-mono">
                                    <div className="flex justify-between text-slate-600 font-bold border-b border-slate-200 pb-1">
                                        <span>MONTO PAGADO</span>
                                        <span>MÉTODO DE PAGO</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm text-slate-800 pt-0.5">
                                        <span>${Number(selectedSale.monto_recibido || selectedSale.total).toFixed(2)}</span>
                                        <span className="text-blue-600 uppercase">{selectedSale.metodo_pago}</span>
                                    </div>
                                    {Number(selectedSale.cambio || 0) > 0 && (
                                        <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200 mt-1">
                                            <span>Cambio Entregado:</span>
                                            <span className="font-bold text-slate-700">${Number(selectedSale.cambio).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* CÓDIGO QR Y CÓDIGO DE BARRAS */}
                                <div className="pt-2 flex flex-col items-center justify-center space-y-2 border-t border-dashed border-gray-300">
                                    {renderTicketQRCode(selectedSale.codigo_ticket, Number(selectedSale.total))}
                                    
                                    <div className="text-center space-y-0.5">
                                        <div className="inline-block font-mono tracking-widest text-base font-black bg-slate-100 px-3 py-1 rounded border border-slate-300">
                                            |||||||||||||||||||||||||||||
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 font-bold">
                                            {selectedSale.codigo_ticket}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-dashed border-gray-300 my-2"></div>
                                <div className="text-center text-xs font-bold text-slate-700 uppercase">
                                    ¡GRACIAS POR SU COMPRA!
                                </div>
                                <div className="text-center text-[10px] text-slate-400">
                                    {empresa?.razon_social || 'Servitec POS'} - Formato Ticket 80mm
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button variant="outline" className="w-full font-bold gap-1.5" onClick={() => window.print()}>
                                    <Printer className="w-4 h-4 text-blue-600" />
                                    {__('Imprimir Ticket (80mm)')}
                                </Button>
                                <Button variant="secondary" className="w-full font-bold" onClick={() => setSelectedSale(null)}>
                                    {__('Cerrar')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* PLANTILLA DE IMPRESIÓN OFICIAL TICKET 80MM (ADMIN/VENTAS) */}
                {selectedSale && (
                    <div id="printable-ticket-admin" className="hidden print:block text-black bg-white font-sans p-4 text-xs w-[80mm] max-w-[80mm] mx-auto">
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
                            {empresa?.logo ? (
                                <img
                                    src={empresa.logo}
                                    alt={empresa.razon_social || 'Logo'}
                                    className="h-10 max-w-[160px] mx-auto object-contain"
                                />
                            ) : (
                                <div className="font-black text-base uppercase">{empresa?.razon_social || 'FixSale - Servitec POS'}</div>
                            )}
                        </div>

                        {empresa?.razon_social && (
                            <div className="text-center font-bold text-xs uppercase">{empresa.razon_social}</div>
                        )}
                        {empresa?.documento && (
                            <div className="text-center text-[9px] font-mono">RIF / RUC: {empresa.documento}</div>
                        )}
                        <div className="text-center text-[9px] text-gray-700">
                            {empresa?.telefono ? `Tel: ${empresa.telefono}` : ''} {empresa?.email ? `| ${empresa.email}` : ''}
                        </div>
                        {empresa?.direccion && (
                            <div className="text-center text-[8px] text-gray-600">{empresa.direccion}</div>
                        )}

                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center font-bold uppercase text-[10px]">COMPROBANTE DE VENTA TÉRMICO (80MM)</div>
                        <div className="flex justify-between text-[10px] font-mono mt-1">
                            <span>TICKET: {selectedSale.codigo_ticket}</span>
                            <span>{new Date(selectedSale.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[10px]">CLIENTE: {selectedSale.cliente_nombre || 'Cliente General'}</div>
                        <div className="text-[10px]">ATENDIÓ: {selectedSale.user?.name || 'Cajero POS'}</div>
                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Encabezado Tabla */}
                        <div className="grid grid-cols-12 text-[10px] font-bold border-b border-black pb-0.5">
                            <span className="col-span-1">#</span>
                            <span className="col-span-5">DESCRIPCIÓN</span>
                            <span className="col-span-2 text-center">CANT</span>
                            <span className="col-span-2 text-right">P.U.</span>
                            <span className="col-span-2 text-right">TOTAL</span>
                        </div>

                        {/* Items */}
                        {selectedSale.items?.map((item, idx) => (
                            <div key={item.id} className="grid grid-cols-12 text-[10px] py-0.5 border-b border-dotted border-gray-400">
                                <span className="col-span-1">{idx + 1}</span>
                                <span className="col-span-5 truncate">{item.nombre}</span>
                                <span className="col-span-2 text-center">{item.cantidad}</span>
                                <span className="col-span-2 text-right">${Number(item.precio_unitario).toFixed(2)}</span>
                                <span className="col-span-2 text-right font-bold">${Number(item.subtotal).toFixed(2)}</span>
                            </div>
                        ))}

                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Totales */}
                        <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                                <span>SUBTOTAL:</span>
                                <span>${Number(selectedSale.subtotal || selectedSale.total).toFixed(2)}</span>
                            </div>
                            {Number(selectedSale.descuento || 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>DESCUENTO:</span>
                                    <span>-${Number(selectedSale.descuento).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-bold border-t border-b border-black py-0.5">
                                <span>TOTAL A PAGAR:</span>
                                <span>{currencySymbol}{Number(selectedSale.total).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-b border-dashed border-black my-1"></div>

                        {/* Métodos de Pago */}
                        <div className="text-[10px] space-y-0.5">
                            <div className="font-bold">PAGADO CON ({selectedSale.metodo_pago.toUpperCase()}):</div>
                            <div className="flex justify-between">
                                <span>RECIBIDO:</span>
                                <span>${Number(selectedSale.monto_recibido || selectedSale.total).toFixed(2)}</span>
                            </div>
                            {Number(selectedSale.cambio || 0) > 0 && (
                                <div className="flex justify-between font-bold">
                                    <span>CAMBIO:</span>
                                    <span>${Number(selectedSale.cambio).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* CÓDIGO QR PARA VALIDACIÓN */}
                        <div className="text-center pt-2 pb-1 flex flex-col items-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`TICKET:${selectedSale.codigo_ticket}|TOTAL:${selectedSale.total}`)}`}
                                alt="QR Ticket"
                                className="h-16 w-16 object-contain"
                            />
                            <div className="text-[8px] font-mono text-gray-600 mt-0.5">ESCANEAR PARA VALIDAR</div>
                        </div>

                        {/* BARCODE */}
                        <div className="text-center pt-1">
                            <div className="inline-block font-mono text-xs tracking-widest font-bold">
                                |||||||||||||||||||||||||||||
                            </div>
                            <div className="text-[9px] font-mono text-gray-600">{selectedSale.codigo_ticket}</div>
                        </div>

                        <div className="border-b border-dashed border-black my-1"></div>
                        <div className="text-center text-[10px] font-bold uppercase">¡GRACIAS POR SU COMPRA!</div>
                        <div className="text-center text-[9px] text-gray-600">{empresa?.razon_social || 'Servitec POS'} - Ticket 80mm</div>
                    </div>
                )}
            </div>
        </>
    );
}
