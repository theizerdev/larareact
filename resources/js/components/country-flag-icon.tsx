import React from 'react';
import { cn } from '@/lib/utils';

export interface CountryFlagIconProps extends React.HTMLAttributes<HTMLSpanElement> {
    iso2?: string | null;
    className?: string;
    square?: boolean;
    title?: string;
}

export function CountryFlagIcon({
    iso2,
    className = '',
    square = false,
    title,
    ...props
}: CountryFlagIconProps) {
    if (!iso2 || iso2.trim().length !== 2) {
        return (
            <span
                className={cn(
                    'inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-[3px] text-slate-400 font-mono text-[10px] shrink-0 border border-slate-200/60 dark:border-slate-700/60 select-none',
                    className
                )}
                title={title || 'Global'}
                {...props}
            >
                🌐
            </span>
        );
    }

    const code = iso2.trim().toLowerCase();

    return (
        <span
            className={cn(
                'fi',
                `fi-${code}`,
                square && 'fis',
                'rounded-[3px] shadow-2xs shrink-0 inline-block align-middle select-none',
                className
            )}
            title={title || iso2.toUpperCase()}
            {...props}
        />
    );
}

export default CountryFlagIcon;
