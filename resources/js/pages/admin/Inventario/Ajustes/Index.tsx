import { Head, useForm, router } from '@inertiajs/react';
import {
    Boxes,
    Plus,
    ArrowDownLeft,
    ArrowUpRight,
    SlidersHorizontal,
    History,
    Search,
    Package,
    User,
    FileText,
    CheckCircle2,
    AlertCircle,
    Info,
    Calendar,
    Barcode,
    X,
    RefreshCw,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface ProductoOption {
    id: number;
    nombre: string;
    nombre_variante?: string;
    marca?: string;
    modelo?: string;
    categoria?: string;
    sku: string;
    codigo_barras?: string;
    stock_actual: number;
    precio_venta: number;
    tipo_venta: string;
}

interface InventoryMovementItem {
    id: number;
    tipo: 'entrada' | 'salida' | 'ajuste' | 'venta';
    motivo: string;
    cantidad: number;
    stock_anterior: number;
    stock_nuevo: number;
    referencia?: string | null;
    costo_unitario?: number | null;
    notas?: string | null;
    created_at: string;
    producto?: {
        id: number;
        sku: string;
        nombre_variante: string;
        marca?: { nombre: string };
        modelo?: { nombre_comercial: string };
    };
    user?: {
        name: string;
    };
}

interface Props {
    movements: {
        data: InventoryMovementItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    productos: ProductoOption[];
    filters: {
        search?: string;
        tipo?: string;
        producto_id?: string;
        perPage?: string;
    };
    stats: {
        totalEntradas: number;
        totalSalidas: number;
        totalAjustes: number;
        totalMovimientos: number;
    };
}

const MOTIVOS_ENTRADA = [
    'Compra Rápida de Inventario',
    'Devolución de Cliente',
    'Hallazgo en Conteo Físico',
    'Ingreso por Garantía',
    'Ajuste Administrativo (Entrada)',
    'Otro (Especificar en notas)',
];

const MOTIVOS_SALIDA = [
    'Merma / Daño de Producto',
    'Consumo Interno de Sucursal',
    'Producto Defectuoso',
    'Garantía Devuelta a Proveedor',
    'Pérdida / Extravío',
    'Ajuste Administrativo (Salida)',
    'Otro (Especificar en notas)',
];

const MOTIVOS_AJUSTE = [
    'Conteo Físico de Reconciliación',
    'Inventario Inicial de Registro',
    'Corrección de Auditoría',
    'Otro (Especificar en notas)',
];

export default function InventoryAdjustmentIndexPage({
    movements,
    productos,
    filters,
    stats,
}: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [tipoFilter, setTipoFilter] = useState(filters.tipo || 'all');

    // Estado para búsqueda estilo POS Terminal en el modal
    const [posSearchQuery, setPosSearchQuery] = useState('');
    const [posSelectedIndex, setPosSelectedIndex] = useState(0);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Inventario'), href: '/admin/productos' },
        { title: __('Ajustes de Stock'), href: '/admin/inventario/ajustes' },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        producto_id: '',
        tipo: 'entrada',
        motivo: MOTIVOS_ENTRADA[0],
        cantidad: '',
        costo_unitario: '',
        referencia: '',
        notas: '',
    });

    const selectedProd = useMemo(
        () => productos.find((p) => String(p.id) === data.producto_id),
        [productos, data.producto_id]
    );

    // Filtro predictivo al estilo POS Terminal (soporta SKU, código de barras, variante, marca, modelo)
    const filteredPosProducts = useMemo(() => {
        if (!posSearchQuery.trim()) {
            return productos.slice(0, 10);
        }
        const q = posSearchQuery.toLowerCase().trim();
        return productos.filter((p) => {
            const sku = (p.sku || '').toLowerCase();
            const barcode = (p.codigo_barras || '').toLowerCase();
            const name = (p.nombre || '').toLowerCase();
            const brand = (p.marca || '').toLowerCase();
            const model = (p.modelo || '').toLowerCase();

            return (
                sku.includes(q) ||
                barcode.includes(q) ||
                name.includes(q) ||
                brand.includes(q) ||
                model.includes(q)
            );
        }).slice(0, 15);
    }, [productos, posSearchQuery]);

    const selectPosProduct = (prod: ProductoOption) => {
        setData('producto_id', String(prod.id));
        setPosSearchQuery('');
        setPosSelectedIndex(0);
    };

    const handlePosKeyDown = (e: React.KeyboardEvent) => {
        if (filteredPosProducts.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setPosSelectedIndex((prev) => (prev < filteredPosProducts.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setPosSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredPosProducts[posSelectedIndex]) {
                selectPosProduct(filteredPosProducts[posSelectedIndex]);
            }
        }
    };

    const handleSearch = () => {
        router.get(
            '/admin/inventario/ajustes',
            cleanParams({
                search: searchTerm,
                tipo: tipoFilter === 'all' ? undefined : tipoFilter,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClear = () => {
        setSearchTerm('');
        setTipoFilter('all');
        router.get('/admin/inventario/ajustes', {}, { preserveState: true, preserveScroll: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/inventario/ajustes', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                setPosSearchQuery('');
                notifySuccess(__('Ajuste de inventario registrado correctamente.'));
            },
            onError: () => {
                notifyError(__('Ocurrió un error al registrar el ajuste de inventario.'));
            },
        });
    };

    return (
        <>
            <Head title={__('Ajustes de Inventario')} />

            <div className="space-y-6">
                <Breadcrumbs items={breadcrumbs} />

                {/* Header Principal */}
                <ModuleHeader
                    icon={<Boxes className="h-6 w-6 text-white" />}
                    title={__('Ajustes de Inventario')}
                    description={__('Registro y auditoría de entradas, salidas, mermas, devoluciones y correcciones de stock físico.')}
                    colorClassName="bg-emerald-600 dark:bg-emerald-700"
                >
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Ajuste de Stock')}
                    </Button>
                </ModuleHeader>

                {/* StatCards KPI */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={__('Entradas del Mes')}
                        value={`+${stats.totalEntradas}`}
                        icon={<ArrowDownLeft className="h-5 w-5 text-emerald-500" />}
                        description={__('Unidades sumadas al inventario')}
                        colorClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    />
                    <StatCard
                        title={__('Salidas del Mes')}
                        value={`-${stats.totalSalidas}`}
                        icon={<ArrowUpRight className="h-5 w-5 text-rose-500" />}
                        description={__('Unidades restadas por mermas/salidas')}
                        colorClassName="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    />
                    <StatCard
                        title={__('Ajustes Directos')}
                        value={stats.totalAjustes}
                        icon={<SlidersHorizontal className="h-5 w-5 text-blue-500" />}
                        description={__('Reconciliaciones de stock físico')}
                        colorClassName="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                    />
                    <StatCard
                        title={__('Total Movimientos')}
                        value={stats.totalMovimientos}
                        icon={<History className="h-5 w-5 text-purple-500" />}
                        description={__('Registros de auditoría en sistema')}
                    />
                </div>

                {/* Filtros de Búsqueda */}
                <div className="rounded-xl border bg-card p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-semibold text-muted-foreground">{__('Buscar Movimientos')}</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Buscar por motivo, referencia o producto SKU...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Select value={tipoFilter} onValueChange={(val) => setTipoFilter(val)}>
                                <SelectTrigger className="text-xs w-full">
                                    <SelectValue placeholder={__('Todos los tipos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los tipos')}</SelectItem>
                                    <SelectItem value="entrada">{__('🟢 Entradas')}</SelectItem>
                                    <SelectItem value="salida">{__('🔴 Salidas')}</SelectItem>
                                    <SelectItem value="ajuste">{__('🔵 Ajustes Fijos')}</SelectItem>
                                    <SelectItem value="venta">{__('🛒 Ventas POS')}</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleSearch} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                                {__('Buscar')}
                            </Button>
                            {(searchTerm || tipoFilter !== 'all') && (
                                <Button onClick={handleClear} variant="outline" className="text-xs">
                                    {__('Limpiar')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de Movimientos */}
                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b">
                                <tr>
                                    <th className="p-3">{__('Fecha')}</th>
                                    <th className="p-3">{__('Producto / Variante')}</th>
                                    <th className="p-3 text-center">{__('Tipo')}</th>
                                    <th className="p-3">{__('Motivo')}</th>
                                    <th className="p-3 text-right">{__('Stock Previo')}</th>
                                    <th className="p-3 text-right">{__('Movimiento')}</th>
                                    <th className="p-3 text-right">{__('Nuevo Stock')}</th>
                                    <th className="p-3">{__('Referencia')}</th>
                                    <th className="p-3">{__('Usuario')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {movements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            {__('No hay movimientos de inventario registrados.')}
                                        </td>
                                    </tr>
                                ) : (
                                    movements.data.map((m) => {
                                        const isEntrada = m.tipo === 'entrada';
                                        const isSalida = m.tipo === 'salida';
                                        const isAjuste = m.tipo === 'ajuste';

                                        return (
                                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                                <td className="p-3 whitespace-nowrap font-mono text-muted-foreground">
                                                    {new Date(m.created_at).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {m.producto?.nombre_variante || __('Producto N/A')}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-muted-foreground">
                                                        SKU: {m.producto?.sku || '—'}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge
                                                        className={cn(
                                                            'capitalize font-semibold',
                                                            isEntrada && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
                                                            isSalida && 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
                                                            isAjuste && 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
                                                            m.tipo === 'venta' && 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                                                        )}
                                                    >
                                                        {m.tipo}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                                                    {m.motivo}
                                                    {m.notas && <div className="text-[11px] text-muted-foreground italic">{m.notas}</div>}
                                                </td>
                                                <td className="p-3 text-right font-mono text-muted-foreground">
                                                    {m.stock_anterior}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'p-3 text-right font-mono font-bold',
                                                        isEntrada && 'text-emerald-600',
                                                        isSalida && 'text-rose-600',
                                                        isAjuste && 'text-blue-600'
                                                    )}
                                                >
                                                    {isEntrada ? `+${m.cantidad}` : isSalida ? `-${m.cantidad}` : `=` + m.cantidad}
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {m.stock_nuevo}
                                                </td>
                                                <td className="p-3 font-mono text-muted-foreground">
                                                    {m.referencia || '—'}
                                                </td>
                                                <td className="p-3 text-slate-700 dark:text-slate-300">
                                                    {m.user?.name || __('Sistema')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal para Registrar Nuevo Ajuste de Stock */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                <Boxes className="h-5 w-5" />
                                {__('Registrar Ajuste de Inventario')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Suma, resta o establece el stock de un producto con trazabilidad y auditoría.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            {/* Búsqueda de Producto Estilo Terminal POS */}
                            <div className="space-y-1.5">
                                <Label className="text-xs required font-semibold flex items-center justify-between">
                                    <span>{__('Seleccionar Producto / Variante')}</span>
                                    {selectedProd && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('producto_id', '');
                                                setPosSearchQuery('');
                                            }}
                                            className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            {__('Cambiar producto')}
                                        </button>
                                    )}
                                </Label>

                                {!selectedProd ? (
                                    <div className="relative">
                                        <div className="relative">
                                            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                                            <Input
                                                type="text"
                                                autoFocus
                                                placeholder={__('Escriba o escanee SKU, código de barras o nombre...')}
                                                value={posSearchQuery}
                                                onChange={(e) => {
                                                    setPosSearchQuery(e.target.value);
                                                    setPosSelectedIndex(0);
                                                }}
                                                onKeyDown={handlePosKeyDown}
                                                className="pl-9 pr-8 text-xs font-medium h-10 border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                            />
                                            {posSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPosSearchQuery('')}
                                                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-slate-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Dropdown Predictivo Estilo POS */}
                                        {filteredPosProducts.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl divide-y">
                                                {filteredPosProducts.map((p, idx) => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => selectPosProduct(p)}
                                                        onMouseEnter={() => setPosSelectedIndex(idx)}
                                                        className={cn(
                                                            'p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs',
                                                            posSelectedIndex === idx
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-l-emerald-600'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                                                <Package className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                                                    {p.nombre}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                                                                    <span>SKU: {p.sku}</span>
                                                                    {p.codigo_barras && <span>· Barcode: {p.codigo_barras}</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'font-mono text-[11px] font-bold px-2 py-0.5',
                                                                    p.stock_actual > 0
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                                        : 'bg-rose-50 text-rose-700 border-rose-300'
                                                                )}
                                                            >
                                                                Stock: {p.stock_actual} pzas
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {posSearchQuery.trim() !== '' && filteredPosProducts.length === 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 p-4 bg-popover border rounded-xl shadow-xl text-center text-xs text-muted-foreground">
                                                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                                                {__('No se encontraron productos coincidentes.')}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Ficha del Producto Seleccionado */
                                    <div className="p-3.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                    {selectedProd.nombre}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                                                    <span>SKU: {selectedProd.sku}</span>
                                                    {selectedProd.codigo_barras && (
                                                        <span>· Barcode: {selectedProd.codigo_barras}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">{__('Stock Actual')}</span>
                                            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                                                {selectedProd.stock_actual} <span className="text-xs font-sans font-semibold">pzas</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {errors.producto_id && <p className="text-xs text-rose-500 font-semibold">{errors.producto_id}</p>}
                            </div>

                            {/* Selector Tipo de Ajuste */}
                            <div className="space-y-1.5">
                                <Label className="text-xs required font-semibold">{__('Tipo de Operación')}</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((prev) => ({
                                                ...prev,
                                                tipo: 'entrada',
                                                motivo: MOTIVOS_ENTRADA[0],
                                            }));
                                        }}
                                        className={cn(
                                            'p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all',
                                            data.tipo === 'entrada'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20'
                                                : 'hover:bg-slate-50 text-slate-600'
                                        )}
                                    >
                                        <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                        <span>🟢 {__('Entrada (+)')}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((prev) => ({
                                                ...prev,
                                                tipo: 'salida',
                                                motivo: MOTIVOS_SALIDA[0],
                                            }));
                                        }}
                                        className={cn(
                                            'p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all',
                                            data.tipo === 'salida'
                                                ? 'bg-rose-50 text-rose-700 border-rose-500 ring-2 ring-rose-500/20'
                                                : 'hover:bg-slate-50 text-slate-600'
                                        )}
                                    >
                                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                        <span>🔴 {__('Salida (-)')}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData((prev) => ({
                                                ...prev,
                                                tipo: 'ajuste',
                                                motivo: MOTIVOS_AJUSTE[0],
                                            }));
                                        }}
                                        className={cn(
                                            'p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all',
                                            data.tipo === 'ajuste'
                                                ? 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20'
                                                : 'hover:bg-slate-50 text-slate-600'
                                        )}
                                    >
                                        <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                                        <span>🔵 {__('Ajuste Fijo (=)')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Motivo */}
                            <div className="space-y-1.5">
                                <Label htmlFor="motivo" className="text-xs required font-semibold">{__('Motivo del Ajuste')}</Label>
                                <Select value={data.motivo} onValueChange={(val) => setData('motivo', val)}>
                                    <SelectTrigger id="motivo" className="w-full text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(data.tipo === 'entrada'
                                            ? MOTIVOS_ENTRADA
                                            : data.tipo === 'salida'
                                            ? MOTIVOS_SALIDA
                                            : MOTIVOS_AJUSTE
                                        ).map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.motivo && <p className="text-xs text-rose-500 font-semibold">{errors.motivo}</p>}
                            </div>

                            {/* Cantidad y Referencia */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="cantidad" className="text-xs required font-semibold">
                                        {data.tipo === 'ajuste' ? __('Nuevo Stock Fijo') : __('Cantidad')}
                                    </Label>
                                    <Input
                                        id="cantidad"
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        required
                                        placeholder="Ej: 5"
                                        value={data.cantidad}
                                        onChange={(e) => setData('cantidad', e.target.value)}
                                        className="h-9 font-bold"
                                    />
                                    {errors.cantidad && <p className="text-xs text-rose-500 font-semibold">{errors.cantidad}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="referencia" className="text-xs font-semibold">{__('N° Referencia / Factura')}</Label>
                                    <Input
                                        id="referencia"
                                        placeholder="Ej: FACT-1234"
                                        value={data.referencia}
                                        onChange={(e) => setData('referencia', e.target.value)}
                                        className="h-9 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Notas / Observaciones */}
                            <div className="space-y-1.5">
                                <Label htmlFor="notas" className="text-xs font-semibold">{__('Notas u Observaciones')}</Label>
                                <Textarea
                                    id="notas"
                                    rows={2}
                                    placeholder={__('Detalles adicionales sobre esta operación...')}
                                    value={data.notas}
                                    onChange={(e) => setData('notas', e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    {__('Confirmar Ajuste')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
