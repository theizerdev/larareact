import { router, usePage } from '@inertiajs/react';
import type { HTMLAttributes } from 'react';
import { CountryFlagIcon } from '@/components/country-flag-icon';
import { cn } from '@/lib/utils';

export interface LanguageTabsProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'cards';
}

export default function LanguageTabs({
    className = '',
    variant = 'default',
    ...props
}: LanguageTabsProps) {
    const { locale } = usePage().props as any;
    const currentLocale = (locale === 'en' ? 'en' : 'es') as 'es' | 'en';

    const tabs = [
        {
            value: 'es' as const,
            label: 'Español',
            sublabel: 'Castellano (ES)',
            iso2: 'es',
        },
        {
            value: 'en' as const,
            label: 'English',
            sublabel: 'United States (US)',
            iso2: 'us',
        },
    ];

    const changeLanguage = (lang: 'es' | 'en') => {
        if (lang === currentLocale) {
            return;
        }

        router.post(
            '/locale',
            { locale: lang },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            },
        );
    };

    if (variant === 'cards') {
        return (
            <div
                className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3.5', className)}
                {...props}
            >
                {tabs.map(({ value, label, sublabel, iso2 }) => {
                    const isSelected = currentLocale === value;

                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => changeLanguage(value)}
                            className={cn(
                                'group relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20 dark:ring-primary/30'
                                    : 'border-slate-200/80 dark:border-slate-800 bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
                            )}
                        >
                            <div className="flex items-center gap-3.5">
                                <div
                                    className={cn(
                                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105',
                                        isSelected
                                            ? 'border-primary/30 bg-primary/10 shadow-xs'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80'
                                    )}
                                >
                                    <CountryFlagIcon
                                        iso2={iso2}
                                        className="text-2xl rounded-[3px] shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-foreground">
                                            {label}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border',
                                                isSelected
                                                    ? 'bg-primary/15 text-primary border-primary/30'
                                                    : 'bg-muted text-muted-foreground border-border'
                                            )}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {sublabel}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    'h-5 w-5 rounded-full border flex items-center justify-center transition-colors',
                                    isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400'
                                )}
                            >
                                {isSelected && (
                                    <span className="h-2 w-2 rounded-full bg-white dark:bg-slate-950" />
                                )}
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
            {tabs.map(({ value, label, iso2 }) => {
                const isSelected = currentLocale === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => changeLanguage(value)}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150',
                            isSelected
                                ? 'bg-white shadow-xs dark:bg-slate-900 text-foreground dark:text-slate-100 ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-muted-foreground hover:bg-slate-200/60 hover:text-foreground dark:hover:bg-slate-700/60',
                        )}
                    >
                        <CountryFlagIcon
                            iso2={iso2}
                            className="text-base rounded-[2px] shadow-2xs"
                        />
                        <span className="text-sm">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
