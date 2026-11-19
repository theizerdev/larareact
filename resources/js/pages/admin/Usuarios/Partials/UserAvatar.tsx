import { Crown } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { getAvatarGradient, getUserInitials } from './types';

interface UserAvatarProps {
    name: string;
    email?: string;
    status?: 'activo' | 'inactivo' | 'suspendido';
    isLocked?: boolean;
    isSuperAdmin?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showStatusDot?: boolean;
    className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { container: string; text: string; dot: string; crownBadge: string; crownIcon: string }> = {
    sm: {
        container: 'h-10 w-10 rounded-full text-xs',
        text: 'text-xs',
        dot: 'h-2.5 w-2.5 border-2',
        crownBadge: 'h-4 w-4 -top-1 -right-1',
        crownIcon: 'h-2.5 w-2.5',
    },
    md: {
        container: 'h-11 w-11 rounded-2xl text-sm',
        text: 'text-sm',
        dot: 'h-3 w-3 border-2',
        crownBadge: 'h-4.5 w-4.5 -top-1 -right-1',
        crownIcon: 'h-2.5 w-2.5',
    },
    lg: {
        container: 'h-12 w-12 rounded-2xl text-base',
        text: 'text-base',
        dot: 'h-3 w-3 border-2',
        crownBadge: 'h-5 w-5 -top-1 -right-1',
        crownIcon: 'h-3 w-3',
    },
};

export function UserAvatar({
    name,
    email,
    status = 'activo',
    isLocked = false,
    isSuperAdmin = false,
    size = 'md',
    showStatusDot = true,
    className,
}: UserAvatarProps) {
    const initials = getUserInitials(name);
    const gradient = getAvatarGradient(email || name || 'user', isSuperAdmin);
    const sizeCfg = SIZE_CLASSES[size];

    const dotClass =
        isLocked || status === 'suspendido'
            ? 'bg-rose-500'
            : status === 'activo'
              ? 'bg-emerald-500'
              : 'bg-slate-400';

    const statusTitle = isLocked
        ? 'Bloqueado SOX'
        : status === 'activo'
          ? 'Activo'
          : status === 'suspendido'
            ? 'Suspendido'
            : 'Inactivo';

    return (
        <div className={cn('relative inline-flex shrink-0 select-none', className)}>
            <div
                className={cn(
                    'flex items-center justify-center bg-gradient-to-br font-extrabold tracking-tight text-white shadow-sm ring-2 ring-white/80 dark:ring-slate-900',
                    gradient,
                    sizeCfg.container,
                    sizeCfg.text
                )}
                aria-label={name}
            >
                {initials}
            </div>

            {isSuperAdmin && (
                <span
                    title="Super Administrador"
                    className={cn(
                        'absolute flex items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow ring-2 ring-white dark:ring-slate-950',
                        sizeCfg.crownBadge
                    )}
                >
                    <Crown className={sizeCfg.crownIcon} />
                </span>
            )}

            {showStatusDot && (
                <span
                    title={statusTitle}
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 rounded-full border-white dark:border-slate-950 shadow-xs',
                        sizeCfg.dot,
                        dotClass
                    )}
                />
            )}
        </div>
    );
}
