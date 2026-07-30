import { Head, router } from '@inertiajs/react';
import {
    History,
    Search,
    Package,
    Calendar,
    User,
    ArrowDownLeft,
    ArrowUpRight,
    SlidersHorizontal,
    ShoppingCart,
    Filter,
    RefreshCw,
    Boxes,
    Tag,
    Layers,
    Barcode,
    X,
    AlertCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';

interface ProductoOption {
    id: number;
    nombre: string;
    marca?: string;
    modelo?: string;
    categoria?: string;
    sku: string;
    codigo_barras?: string;
    stock_actual: number;
}

interface SelectedProducto {
    id: number;
    nombre: string;
    sku: string;
    stock: number;
    stock_minimo: number;
    precio_venta: number;
    precio_compra: number;
    categoria?: string;
    marca?: string;
    modelo?: string;
}

interface Movement {
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
        data: Movement[];
        current_page: number;
        last_page: number;
        total: number;
    };
    productos: ProductoOption[];
    selectedProducto: SelectedProducto | null;
    filters: {
        search?: string;
        tipo?: string;
        producto_id?: string;
        start_date?: string;
        end_date?: string;
        perPage?: string;
    };
}

export default function KardexIndexPage({
    movements,
    productos,
    selectedProducto,
    filters,
}: Props) {
    const { __ } = useTranslate();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [tipoFilter, setTipoFilter] = useState(filters.tipo || 'all');
    const [productoIdFilter, setProductoIdFilter] = useState(filters.producto_id || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Búsqueda interactiva estilo Terminal POS
    const [posSearchQuery, setPosSearchQuery] = useState('');
    const [posSelectedIndex, setPosSelectedIndex] = useState(0);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Inventario'), href: '/admin/productos' },
        { title: __('Kardex de Movimientos'), href: '/admin/inventario/kardex' },
    ];

    const filteredPosProducts = useMemo(() => {
        if (!posSearchQuery.trim()) return [];
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

    const selectPosProduct = (prodId: string) => {
        setProductoIdFilter(prodId);
        setPosSearchQuery('');
        handleFilter(prodId);
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
                selectPosProduct(String(filteredPosProducts[posSelectedIndex].id));
            }
        }
    };

    const handleFilter = (newProductoId?: string) => {
        const prodId = newProductoId !== undefined ? newProductoId : productoIdFilter;
        router.get(
            '/admin/inventario/kardex',
            cleanParams({
                search: searchTerm,
                tipo: tipoFilter === 'all' ? undefined : tipoFilter,
                producto_id: prodId === 'all' ? undefined : prodId,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClear = () => {
        setSearchTerm('');
        setTipoFilter('all');
        setProductoIdFilter('all');
        setStartDate('');
        setEndDate('');
        setPosSearchQuery('');
        router.get('/admin/inventario/kardex', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title={__('Kardex de Movimientos')} />

            <div className="space-y-6">
                <Breadcrumbs items={breadcrumbs} />

                {/* Header Principal */}
                <ModuleHeader
                    icon={<History className="h-6 w-6 text-white" />}
                    title={__('Kardex & Trazabilidad de Inventario')}
                    description={__('Historial auditado e inalterable de todos los movimientos de entrada, salida, ajustes y ventas en el sistema.')}
                    colorClassName="bg-purple-600 dark:bg-purple-700"
                />

                {/* Selector Principal de Producto para Filtrar Kardex (Búsqueda Estilo POS) */}
                <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-600" />
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {__('Seleccionar Producto para Auditar Kardex')}
                            </h3>
                        </div>
                        {selectedProducto && (
                            <Badge variant="outline" className="font-mono text-xs border-purple-300 bg-purple-50 text-purple-700 font-bold">
                                SKU: {selectedProducto.sku}
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-8 space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                <span>{__('Buscador Predictivo Estilo POS Terminal')}</span>
                                {productoIdFilter !== 'all' && (
                                    <button
                                        type="button"
                                        onClick={() => selectPosProduct('all')}
                                        className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        {__('Ver todos los productos')}
                                    </button>
                                )}
                            </Label>

                            <div className="relative">
                                <div className="relative">
                                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-purple-600" />
                                    <Input
                                        type="text"
                                        placeholder={__('Escriba o escanee SKU, código de barras o nombre del producto/variante...')}
                                        value={posSearchQuery}
                                        onChange={(e) => {
                                            setPosSearchQuery(e.target.value);
                                            setPosSelectedIndex(0);
                                        }}
                                        onKeyDown={handlePosKeyDown}
                                        className="pl-9 pr-8 text-xs font-medium h-10 border-slate-300 focus:ring-2 focus:ring-purple-500"
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
                                                onClick={() => selectPosProduct(String(p.id))}
                                                onMouseEnter={() => setPosSelectedIndex(idx)}
                                                className={cn(
                                                    'p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs',
                                                    posSelectedIndex === idx
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 border-l-4 border-l-purple-600'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                )}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold shrink-0">
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
                                                                ? 'bg-purple-50 text-purple-700 border-purple-300'
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
                            </div>
                        </div>

                        <div className="md:col-span-4 flex gap-2">
                            <Button onClick={() => handleFilter()} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">
                                <Filter className="mr-2 h-4 w-4" />
                                {__('Filtrar Kardex')}
                            </Button>
                            {(searchTerm || tipoFilter !== 'all' || productoIdFilter !== 'all' || startDate || endDate || posSearchQuery) && (
                                <Button onClick={handleClear} variant="outline" className="text-xs">
                                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                    {__('Limpiar')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ficha Técnica Corta del Producto Seleccionado */}
                {selectedProducto && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 shadow-xs">
                        <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">{__('Producto / Variante')}</span>
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedProducto.nombre}</span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">{__('Categoría & Marca')}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {selectedProducto.categoria || '—'} • {selectedProducto.marca || '—'}
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">{__('Stock Físico Actual')}</span>
                            <span className="text-lg font-black font-mono text-purple-700 dark:text-purple-400">
                                {selectedProducto.stock} <span className="text-xs font-sans font-normal text-muted-foreground">unidades</span>
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">{__('Precio de Venta')}</span>
                            <span className="text-base font-bold font-mono text-emerald-600">
                                ${selectedProducto.precio_venta.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Filtros Secundarios: Búsqueda por texto, Tipo y Rango de Fechas */}
                <div className="rounded-xl border bg-card p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">{__('Búsqueda por Motivo / Ref')}</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Motivo, referencia...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">{__('Tipo de Movimiento')}</Label>
                            <Select value={tipoFilter} onValueChange={(val) => setTipoFilter(val)}>
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder={__('Todos')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos los tipos')}</SelectItem>
                                    <SelectItem value="entrada">{__('🟢 Entradas (+)')}</SelectItem>
                                    <SelectItem value="salida">{__('🔴 Salidas (-)')}</SelectItem>
                                    <SelectItem value="ajuste">{__('🔵 Ajustes Directos (=)')}</SelectItem>
                                    <SelectItem value="venta">{__('🛒 Ventas en POS')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">{__('Fecha Desde')}</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">{__('Fecha Hasta')}</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabla Kardex de Movimientos */}
                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b">
                                <tr>
                                    <th className="p-3">{__('Fecha & Hora')}</th>
                                    <th className="p-3">{__('Producto / SKU')}</th>
                                    <th className="p-3 text-center">{__('Tipo')}</th>
                                    <th className="p-3">{__('Motivo / Operación')}</th>
                                    <th className="p-3 text-right">{__('Stock Previo')}</th>
                                    <th className="p-3 text-right">{__('Entrada (+)')}</th>
                                    <th className="p-3 text-right">{__('Salida (-)')}</th>
                                    <th className="p-3 text-right">{__('Nuevo Saldo')}</th>
                                    <th className="p-3">{__('Referencia')}</th>
                                    <th className="p-3">{__('Usuario')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {movements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                            {__('No hay registros en el Kardex para los criterios seleccionados.')}
                                        </td>
                                    </tr>
                                ) : (
                                    movements.data.map((m) => {
                                        const isEntrada = m.tipo === 'entrada';
                                        const isSalida = m.tipo === 'salida' || m.tipo === 'venta';
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
                                                            m.tipo === 'salida' && 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
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

                                                {/* Columna Entrada */}
                                                <td className="p-3 text-right font-mono font-bold text-emerald-600">
                                                    {isEntrada ? `+${m.cantidad}` : '—'}
                                                </td>

                                                {/* Columna Salida */}
                                                <td className="p-3 text-right font-mono font-bold text-rose-600">
                                                    {isSalida ? `-${m.cantidad}` : '—'}
                                                </td>

                                                {/* Columna Nuevo Saldo */}
                                                <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
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
            </div>
        </>
    );
}
