import { Inbox, LayoutGrid, List, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

/**
 * Hook SSR-safe para persistir el modo de visualización (Cuadrícula / Lista) en localStorage.
 */
export function useViewMode(storageKey: string, defaultMode: ViewMode = 'grid'): [ViewMode, (mode: ViewMode) => void] {
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window === 'undefined') {
            return defaultMode;
        }

        const saved = window.localStorage.getItem(storageKey);

        if (saved === 'list' || saved === 'grid') {
            return saved;
        }

        return defaultMode;
    });

    const handleChange = (mode: ViewMode) => {
        setViewMode(mode);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(storageKey, mode);
        }
    };

    return [viewMode, handleChange];
}

interface ViewModeToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
    activeColorClassName?: string;
    className?: string;
}

/**
 * Conmutador segmentado Cuadrícula / Lista alineado con el diseño de Roles y Usuarios.
 */
export function ViewModeToggle({
    value,
    onChange,
    activeColorClassName = 'text-indigo-600 dark:text-indigo-400',
    className,
}: ViewModeToggleProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shrink-0',
                className
            )}
            role="group"
            aria-label="Modo de visualización"
        >
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    value === 'grid'
                        ? cn('bg-white dark:bg-slate-900 shadow-xs', activeColorClassName)
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                )}
                title="Vista Cuadrícula"
                aria-pressed={value === 'grid'}
            >
                <LayoutGrid className="h-4 w-4" />
                <span>Cuadrícula</span>
            </button>
            <button
                type="button"
                onClick={() => onChange('list')}
                className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    value === 'list'
                        ? cn('bg-white dark:bg-slate-900 shadow-xs', activeColorClassName)
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                )}
                title="Vista Lista"
                aria-pressed={value === 'list'}
            >
                <List className="h-4 w-4" />
                <span>Lista</span>
            </button>
        </div>
    );
}

interface CardGridSkeletonProps {
    count?: number;
    columnsClassName?: string;
}

export function CardGridSkeleton({
    count = 6,
    columnsClassName = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}: CardGridSkeletonProps) {
    return (
        <div className={cn('grid gap-5', columnsClassName)}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-5 space-y-4 animate-pulse"
                >
                    <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                    </div>
                    <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />
                    <div className="flex justify-between pt-2">
                        <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface GridEmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
    ctaLabel?: string;
    onCtaClick?: () => void;
}

export function GridEmptyState({
    icon,
    title,
    description,
    hasActiveFilters = false,
    onResetFilters,
    ctaLabel,
    onCtaClick,
}: GridEmptyStateProps) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-card p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                {icon || <Inbox className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">{description}</p>
            </div>
            {(hasActiveFilters && onResetFilters) || (ctaLabel && onCtaClick) ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {hasActiveFilters && onResetFilters && (
                        <Button type="button" variant="outline" size="sm" onClick={onResetFilters} className="rounded-xl">
                            Limpiar filtros
                        </Button>
                    )}
                    {ctaLabel && onCtaClick && (
                        <Button type="button" size="sm" onClick={onCtaClick} className="rounded-xl gap-1.5">
                            <Plus className="h-4 w-4" />
                            {ctaLabel}
                        </Button>
                    )}
                </div>
            ) : null}
        </div>
    );
}
