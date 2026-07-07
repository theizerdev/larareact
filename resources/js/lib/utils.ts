import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.entries(params).forEach(([key, val]) => {
        // Excluir cadenas vacías, nulos o indefinidos
        if (val === '' || val === null || val === undefined) {
            return;
        }
        // Excluir valores por defecto para mantener limpia la URL
        if (key === 'page' && (val === 1 || val === '1')) {
            return;
        }
        if (key === 'perPage' && (val === 10 || val === '10')) {
            return;
        }
        cleaned[key] = val;
    });
    return cleaned;
}
