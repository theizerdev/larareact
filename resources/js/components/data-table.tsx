import React from 'react';
import { Paginated } from '@/types/app';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Pagination from '@/components/pagination';
import { router } from '@inertiajs/react';
import { cn, cleanParams } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import { ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal, ChevronDown } from 'lucide-react';

export interface ColumnDef<T> {
    /** Título de la columna o elemento React a renderizar en el header */
    header: React.ReactNode;
    /** Etiqueta de texto simple para el selector de visibilidad (si el header es un ReactNode) */
    dropdownLabel?: string;
    /** Clave del objeto de datos para acceder al valor (opcional si se usa 'cell') */
    accessorKey?: keyof T;
    /** Función para personalizar el renderizado de la celda */
    cell?: (row: T) => React.ReactNode;
    /** Clases de Tailwind adicionales para aplicar a la cabecera y celdas */
    className?: string;
    /** Indica si la columna permite ordenación */
    sortable?: boolean;
    /** Clave alternativa a enviar al backend para ordenar (por defecto accessorKey) */
    sortKey?: string;
    /** Oculta la columna en ciertas resoluciones: 'mobile' (oculta en < 640px), 'tablet' (oculta en < 768px) */
    hideOn?: 'mobile' | 'tablet';
    /** Indica si el usuario puede ocultar esta columna (por defecto true) */
    hideable?: boolean;
    /** Evita que al hacer clic en esta celda se active el callback onRowClick de la fila */
    stopRowClick?: boolean;
}

export interface BulkAction {
    label: string;
    icon?: React.ReactNode;
    onClick: (ids: number[]) => void;
    variant?: 'default' | 'destructive' | 'secondary';
}

export interface DataTableProps<T> {
    /** Datos paginados devueltos por el backend de Laravel */
    data: Paginated<T> & { from?: number; to?: number };
    /** Definición de columnas de la tabla */
    columns: ColumnDef<T>[];
    /** IDs de filas seleccionadas para acciones en lote (opcional) */
    selectedIds?: number[];
    /** Callback disparado al cambiar la selección (opcional) */
    onSelectionChange?: (ids: number[]) => void;
    /** Función para obtener la ID única de una fila (por defecto extrae 'id') */
    getRowId?: (row: T) => number;
    /** Filtros de búsqueda/estado actuales para preservar al paginar/ordenar */
    filters?: Record<string, string | undefined>;
    /** Mensaje de vacío alternativo */
    emptyMessage?: string;
    /** Indica si los datos se están cargando (muestra skeletons) */
    isLoading?: boolean;
    /** Callback para clic en una fila (excepto en celdas de checkbox/acciones) */
    onRowClick?: (row: T) => void;
    /** Acciones en lote personalizadas a mostrar en el banner de selección */
    bulkActions?: BulkAction[];
    /** Configuración para estado vacío ilustrativo */
    emptyState?: {
        title?: string;
        description?: string;
        icon?: React.ReactNode;
        ctaLabel?: string;
        onCtaClick?: () => void;
    };
}

export function DataTable<T>({
    data,
    columns,
    selectedIds,
    onSelectionChange,
    getRowId = (row: any) => row.id,
    filters = {},
    emptyMessage,
    isLoading = false,
    onRowClick,
    bulkActions,
    emptyState,
}: DataTableProps<T>) {
    const { __ } = useTranslate();
    const finalEmptyMessage = emptyMessage || __('No records found');
    const showCheckboxes = !!selectedIds && !!onSelectionChange;
    const hasSelection = showCheckboxes && selectedIds && selectedIds.length > 0;

    // Estado para controlar qué columnas están ocultas localmente
    const [hiddenColumnIndices, setHiddenColumnIndices] = React.useState<Set<number>>(new Set());

    // Manejo de ordenación basado en los filtros de Inertia
    const currentSortKey = filters.sortBy || '';
    const currentSortDir = filters.sortDir || '';

    const handleSort = (column: ColumnDef<T>) => {
        const key = String(column.sortKey || column.accessorKey || '');
        if (!key) return;

        const direction = currentSortKey === key && currentSortDir === 'asc' ? 'desc' : 'asc';
        router.get(
            window.location.pathname,
            cleanParams({
                ...filters,
                sortBy: key,
                sortDir: direction,
                page: 1, // Reiniciamos a la primera página al cambiar el orden
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (onSelectionChange) {
            onSelectionChange(checked ? data.data.map(getRowId) : []);
        }
    };

    const handleRowSelect = (checked: boolean, id: number) => {
        if (onSelectionChange && selectedIds) {
            if (checked) {
                onSelectionChange([...selectedIds, id]);
            } else {
                onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
            }
        }
    };

    const toggleColumnVisibility = (idx: number) => {
        setHiddenColumnIndices((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    // Helper para determinar la responsividad
    const getResponsiveClass = (hideOn?: 'mobile' | 'tablet') => {
        if (!hideOn) return '';
        if (hideOn === 'mobile') return 'hidden sm:table-cell';
        if (hideOn === 'tablet') return 'hidden md:table-cell';
        return '';
    };

    const allSelected =
        data.data.length > 0 &&
        selectedIds &&
        data.data.every((row) => selectedIds.includes(getRowId(row)));

    const activeColumns = columns.filter((_, idx) => !hiddenColumnIndices.has(idx));
    const totalCols = activeColumns.length + (showCheckboxes ? 1 : 0);

    // Componente por defecto para estado vacío
    const defaultEmptyIcon = (
        <svg
            className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
        </svg>
    );

    return (
        <div className="space-y-4">
            {/* Cabecera superior de la tabla: Acciones en lote y visibilidad de columnas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Banner de Acciones en Lote (si hay selección activa) */}
                <div className="flex-1">
                    {hasSelection && bulkActions && bulkActions.length > 0 ? (
                        <div className="flex items-center justify-between gap-4 p-2 px-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                    {__(':count selected', { count: String(selectedIds.length) })}
                                </span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-blue-600 dark:text-blue-400 p-0 h-auto font-normal hover:underline"
                                    onClick={() => onSelectionChange?.([])}
                                >
                                    {__('Clear')}
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                {bulkActions.map((action, idx) => (
                                    <Button
                                        key={idx}
                                        variant={action.variant || 'default'}
                                        size="sm"
                                        className="h-8"
                                        onClick={() => action.onClick(selectedIds)}
                                    >
                                        {action.icon && <span className="mr-1.5">{action.icon}</span>}
                                        {__(action.label)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            {data.total > 0 && !isLoading && (
                                <span>{__('Total records')}: {data.total}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Dropdown de visibilidad de columnas */}
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                {__('Columns')}
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {columns.map((column, idx) => {
                                if (column.hideable === false) return null;
                                // Obtenemos una etiqueta de texto legible para el header
                                const label =
                                    column.dropdownLabel ? __(column.dropdownLabel) :
                                    (typeof column.header === 'string'
                                        ? __(column.header)
                                        : __('Column :number', { number: String(idx + 1) }));

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={idx}
                                        checked={!hiddenColumnIndices.has(idx)}
                                        onCheckedChange={() => toggleColumnVisibility(idx)}
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Contenedor principal de la tabla */}
            <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {showCheckboxes && (
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={!!allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label={__('Select all')}
                                    />
                                </TableHead>
                            )}
                            {columns.map((column, idx) => {
                                if (hiddenColumnIndices.has(idx)) return null;

                                const responsiveClass = getResponsiveClass(column.hideOn);
                                const isSortActive =
                                    String(column.sortKey || column.accessorKey || '') ===
                                    currentSortKey;
                                const headerText = typeof column.header === 'string' ? __(column.header) : column.header;

                                return (
                                    <TableHead
                                        key={idx}
                                        className={cn(column.className, responsiveClass)}
                                    >
                                        {column.sortable ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="-ml-3 h-8 data-[state=open]:bg-accent"
                                                onClick={() => handleSort(column)}
                                            >
                                                <span>{headerText}</span>
                                                {isSortActive ? (
                                                    currentSortDir === 'asc' ? (
                                                        <ArrowUp className="ml-2 h-4 w-4" />
                                                    ) : (
                                                        <ArrowDown className="ml-2 h-4 w-4" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
                                                )}
                                            </Button>
                                        ) : (
                                            headerText
                                        )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            /* --- Renderizado de Skeletons --- */
                            Array.from({ length: 5 }).map((_, rowIdx) => (
                                <TableRow key={rowIdx}>
                                    {showCheckboxes && (
                                        <TableCell className="w-[50px]">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-4"></div>
                                        </TableCell>
                                    )}
                                    {columns.map((column, colIdx) => {
                                        if (hiddenColumnIndices.has(colIdx)) return null;
                                        return (
                                            <TableCell
                                                key={colIdx}
                                                className={cn(
                                                    column.className,
                                                    getResponsiveClass(column.hideOn)
                                                )}
                                            >
                                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : data.data.length > 0 ? (
                            /* --- Renderizado de Filas de Datos --- */
                            data.data.map((row, rowIdx) => {
                                const rowId = getRowId(row);
                                const isSelected = selectedIds?.includes(rowId) ?? false;

                                return (
                                    <TableRow
                                        key={rowId ?? rowIdx}
                                        data-state={isSelected ? 'selected' : ''}
                                        className={cn(
                                            onRowClick &&
                                                'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        )}
                                        onClick={() => onRowClick && onRowClick(row)}
                                    >
                                        {showCheckboxes && (
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(checked) =>
                                                        handleRowSelect(Boolean(checked), rowId)
                                                    }
                                                    aria-label={__('Select row')}
                                                />
                                            </TableCell>
                                        )}
                                        {columns.map((column, colIdx) => {
                                            if (hiddenColumnIndices.has(colIdx)) return null;

                                            let cellContent: React.ReactNode = null;
                                            if (column.cell) {
                                                cellContent = column.cell(row);
                                            } else if (column.accessorKey) {
                                                cellContent = row[column.accessorKey] as any;
                                            }

                                            // Comportamiento de detención del click de fila en ciertas columnas (ej: acciones)
                                            const shouldStopPropagation =
                                                column.stopRowClick ||
                                                column.accessorKey === 'actions' ||
                                                String(column.header) === 'Acciones' ||
                                                (typeof column.header === 'string' &&
                                                    column.header.toLowerCase().includes('accion'));

                                            return (
                                                <TableCell
                                                    key={colIdx}
                                                    className={cn(
                                                        column.className,
                                                        getResponsiveClass(column.hideOn)
                                                    )}
                                                    onClick={(e) => {
                                                        if (shouldStopPropagation) {
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                >
                                                    {cellContent}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            /* --- Renderizado de Estado Vacío Ilustrado --- */
                            <TableRow>
                                <TableCell colSpan={totalCols} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
                                            {emptyState?.icon || defaultEmptyIcon}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                                {emptyState?.title ? __(emptyState.title) : __('No records found')}
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                {emptyState?.description ? __(emptyState.description) : finalEmptyMessage}
                                            </p>
                                        </div>
                                        {emptyState?.ctaLabel && emptyState?.onCtaClick && (
                                            <Button
                                                size="sm"
                                                onClick={emptyState.onCtaClick}
                                                className="mt-2"
                                            >
                                                {__(emptyState.ctaLabel)}
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Componente de Paginación Integrado */}
            <Pagination paginatedData={data} filters={filters} />
        </div>
    );
}
