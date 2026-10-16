import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export interface AppearanceTabsProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'cards';
}

export default function AppearanceTabs({
    className = '',
    variant = 'default',
    ...props
}: AppearanceTabsProps) {
    const { appearance, updateAppearance } = useAppearance();

    const options: {
        value: Appearance;
        icon: LucideIcon;
        label: string;
        description: string;
        badgeColor: string;
    }[] = [
        {
            value: 'light',
            icon: Sun,
            label: 'Claro',
            description: 'Fondo blanco puro y máximo contraste visual',
            badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        },
        {
            value: 'dark',
            icon: Moon,
            label: 'Oscuro',
            description: 'Reduce la fatiga ocular y ahorra batería',
            badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        },
        {
            value: 'system',
            icon: Monitor,
            label: 'Sistema',
            description: 'Sincroniza con el tema de tu dispositivo',
            badgeColor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        },
    ];

    if (variant === 'cards') {
        return (
            <div
                className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}
                {...props}
            >
                {options.map(({ value, icon: Icon, label, description, badgeColor }) => {
                    const isSelected = appearance === value;

                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => updateAppearance(value)}
                            className={cn(
                                'group relative flex flex-col justify-between p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20 dark:ring-primary/30'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                            )}
                        >
                            {/* Preview wireframe mockup */}
                            <div className="w-full h-24 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden mb-4 p-2 relative bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
                                {value === 'light' && (
                                    <div className="w-full h-full rounded-lg bg-white border border-slate-200/80 shadow-2xs p-2 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                            <div className="h-2 w-12 rounded-full bg-slate-300" />
                                            <div className="h-2 w-4 rounded-full bg-primary/80" />
                                        </div>
                                        <div className="flex gap-1.5 flex-1 items-stretch">
                                            <div className="w-1/3 rounded-md bg-slate-100" />
                                            <div className="flex-1 rounded-md bg-slate-50 border border-slate-100 p-1 flex flex-col gap-1">
                                                <div className="h-1.5 w-full rounded bg-slate-200" />
                                                <div className="h-1.5 w-2/3 rounded bg-slate-200" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {value === 'dark' && (
                                    <div className="w-full h-full rounded-lg bg-slate-950 border border-slate-800 shadow-2xs p-2 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                                            <div className="h-2 w-12 rounded-full bg-slate-700" />
                                            <div className="h-2 w-4 rounded-full bg-primary/80" />
                                        </div>
                                        <div className="flex gap-1.5 flex-1 items-stretch">
                                            <div className="w-1/3 rounded-md bg-slate-900" />
                                            <div className="flex-1 rounded-md bg-slate-900/80 border border-slate-800/80 p-1 flex flex-col gap-1">
                                                <div className="h-1.5 w-full rounded bg-slate-800" />
                                                <div className="h-1.5 w-2/3 rounded bg-slate-800" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {value === 'system' && (
                                    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 flex shadow-2xs">
                                        {/* Half Light */}
                                        <div className="w-1/2 h-full bg-white p-2 flex flex-col gap-1.5 border-r border-slate-200">
                                            <div className="h-2 w-8 rounded-full bg-slate-300" />
                                            <div className="flex-1 rounded-md bg-slate-100" />
                                        </div>
                                        {/* Half Dark */}
                                        <div className="w-1/2 h-full bg-slate-950 p-2 flex flex-col gap-1.5">
                                            <div className="h-2 w-8 rounded-full bg-slate-700 self-end" />
                                            <div className="flex-1 rounded-md bg-slate-900" />
                                        </div>
                                    </div>
                                )}

                                {isSelected && (
                                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                        <Check className="h-3 w-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                                        badgeColor
                                    )}
                                >
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                        {label}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60',
                className,
            )}
            {...props}
        >
            {options.map(({ value, icon: Icon, label }) => {
                const isSelected = appearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150',
                            isSelected
                                ? 'bg-white shadow-xs dark:bg-slate-900 text-foreground dark:text-slate-100 ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-muted-foreground hover:bg-slate-200/60 hover:text-foreground dark:hover:bg-slate-700/60',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
