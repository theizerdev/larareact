import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type AvatarStatus = 'active' | 'inactive' | 'warning' | 'danger';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'rounded';

const AVATAR_GRADIENTS = [
    'from-indigo-500 to-violet-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-fuchsia-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-indigo-600',
    'from-violet-500 to-indigo-600',
    'from-teal-500 to-emerald-600',
] as const;

const SIZE_CLASSES: Record<
    AvatarSize,
    {
        container: string;
        circleRadius: string;
        roundedRadius: string;
        text: string;
        dot: string;
    }
> = {
    xs: {
        container: 'h-6 w-6',
        circleRadius: 'rounded-full',
        roundedRadius: 'rounded-lg',
        text: 'text-[10px]',
        dot: 'h-2 w-2 border-[1.5px]',
    },
    sm: {
        container: 'h-9 w-9',
        circleRadius: 'rounded-full',
        roundedRadius: 'rounded-xl',
        text: 'text-xs',
        dot: 'h-2.5 w-2.5 border-2',
    },
    md: {
        container: 'h-10 w-10',
        circleRadius: 'rounded-full',
        roundedRadius: 'rounded-2xl',
        text: 'text-sm',
        dot: 'h-2.5 w-2.5 border-2',
    },
    lg: {
        container: 'h-12 w-12',
        circleRadius: 'rounded-full',
        roundedRadius: 'rounded-2xl',
        text: 'text-base',
        dot: 'h-3 w-3 border-2',
    },
};

const STATUS_DOT_MAP: Record<AvatarStatus, { colorClass: string; label: string }> = {
    active: { colorClass: 'bg-emerald-500', label: 'Activo' },
    inactive: { colorClass: 'bg-slate-400', label: 'Inactivo' },
    warning: { colorClass: 'bg-amber-500', label: 'En revisión / Alerta' },
    danger: { colorClass: 'bg-rose-500', label: 'Suspendido / Crítico' },
};

/**
 * Obtiene iniciales con soporte Unicode a partir de un nombre completo o razón social.
 * - "Smurfit Westrock México" -> "SM"
 * - "Juan Pérez" -> "JP"
 * - "México" -> "MÉ"
 */
export function getInitials(name: string, fallback = 'S'): string {
    const parts = (name || '').trim().split(/\s+/u).filter(Boolean);

    if (parts.length === 0) {
        return fallback;
    }

    if (parts.length === 1) {
        return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
    }

    const firstInitial = Array.from(parts[0])[0] ?? '';
    const lastInitial = Array.from(parts[parts.length - 1])[0] ?? '';

    return `${firstInitial}${lastInitial}`.toUpperCase() || fallback;
}

/**
 * Obtiene iniciales de Nombre y Apellido cuando ambos campos vienen separados.
 * Toma el primer carácter del primer nombre y el primer carácter del apellido.
 */
export function getPersonInitials(
    firstName?: string | null,
    lastName?: string | null,
    fallbackName?: string
): string {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();

    if (first && last) {
        const firstToken = first.split(/\s+/u).filter(Boolean)[0] ?? first;
        const lastToken = last.split(/\s+/u).filter(Boolean)[0] ?? last;
        const fChar = Array.from(firstToken)[0] ?? '';
        const lChar = Array.from(lastToken)[0] ?? '';

        if (fChar || lChar) {
            return `${fChar}${lChar}`.toUpperCase();
        }
    }

    return getInitials(fallbackName || first || last || '');
}

/**
 * Devuelve un gradiente determinista a partir de un seed (nombre, correo, etc.).
 */
export function getAvatarGradient(seed: string): string {
    const clean = (seed || 'entity').trim().toLowerCase();
    let hash = 0;

    for (let i = 0; i < clean.length; i++) {
        hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
    }

    return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

/**
 * Normaliza rutas de medios de Laravel/storage para evitar paths rotos o directorios vacíos.
 */
export function normalizeMediaUrl(path?: string | null): string | null {
    if (!path) {
        return null;
    }

    const cleanPath = String(path).trim();

    if (
        !cleanPath ||
        cleanPath === 'null' ||
        cleanPath === 'undefined' ||
        cleanPath === '/storage/' ||
        cleanPath === 'storage/' ||
        cleanPath === '/storage' ||
        cleanPath === 'storage' ||
        cleanPath.endsWith('/')
    ) {
        return null;
    }

    if (
        cleanPath.startsWith('data:') ||
        cleanPath.startsWith('blob:') ||
        cleanPath.startsWith('http://') ||
        cleanPath.startsWith('https://')
    ) {
        return cleanPath;
    }

    if (cleanPath.startsWith('/storage/') || cleanPath.startsWith('/')) {
        return cleanPath;
    }

    if (cleanPath.startsWith('storage/')) {
        return `/${cleanPath}`;
    }

    return `/storage/${cleanPath}`;
}

export interface EntityAvatarProps {
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    customInitials?: string | null;
    seed?: string | null;
    src?: string | null;
    status?: AvatarStatus | null;
    size?: AvatarSize;
    shape?: AvatarShape;
    showStatusDot?: boolean;
    imageFit?: 'cover' | 'contain';
    className?: string;
}

export function EntityAvatar({
    name,
    firstName,
    lastName,
    customInitials,
    seed,
    src,
    status = null,
    size = 'md',
    shape = 'rounded',
    showStatusDot,
    imageFit = 'cover',
    className,
}: EntityAvatarProps) {
    const normalizedSrc = normalizeMediaUrl(src);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const showImage = Boolean(normalizedSrc && failedSrc !== normalizedSrc);

    const initials = customInitials?.trim()
        ? customInitials.trim().slice(0, 3).toUpperCase()
        : firstName !== undefined || lastName !== undefined
          ? getPersonInitials(firstName, lastName, name)
          : getInitials(name);

    const gradient = getAvatarGradient(seed || name || 'entity');
    const sizeCfg = SIZE_CLASSES[size];
    const radiusClass = shape === 'circle' ? sizeCfg.circleRadius : sizeCfg.roundedRadius;
    const shouldShowDot = (showStatusDot ?? Boolean(status)) && status !== null;
    const statusInfo = status ? STATUS_DOT_MAP[status] : null;

    return (
        <div className={cn('relative inline-flex shrink-0 select-none', className)}>
            {showImage && normalizedSrc ? (
                <div
                    className={cn(
                        'overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-xs ring-2 ring-white/80 dark:ring-slate-900',
                        imageFit === 'contain' ? 'bg-white dark:bg-slate-900 p-0.5' : 'bg-slate-100 dark:bg-slate-800',
                        sizeCfg.container,
                        radiusClass
                    )}
                >
                    <img
                        src={normalizedSrc}
                        alt={name}
                        className={cn(
                            'h-full w-full',
                            imageFit === 'contain' ? 'object-contain' : 'object-cover'
                        )}
                        onError={() => setFailedSrc(normalizedSrc)}
                    />
                </div>
            ) : (
                <div
                    className={cn(
                        'flex items-center justify-center bg-gradient-to-br font-extrabold tracking-tight text-white shadow-sm ring-2 ring-white/80 dark:ring-slate-900',
                        gradient,
                        sizeCfg.container,
                        radiusClass,
                        sizeCfg.text
                    )}
                    aria-label={name}
                >
                    {initials}
                </div>
            )}

            {shouldShowDot && statusInfo && (
                <span
                    title={statusInfo.label}
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 rounded-full border-white dark:border-slate-950 shadow-xs',
                        sizeCfg.dot,
                        statusInfo.colorClass
                    )}
                />
            )}
        </div>
    );
}
