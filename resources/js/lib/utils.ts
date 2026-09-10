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

/**
 * Formatea una fecha ISO o string (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss) de forma amigable y libre de desfases horarios.
 *
 * - 'short': 10/10/2026
 * - 'medium': 10 Oct 2026
 * - 'long': 10 de octubre de 2026
 */
export function formatDate(
    dateStr: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' = 'short'
): string {
    if (!dateStr) return '—';

    const str = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return str;
    }

    const [, year, month, day] = match;

    if (format === 'short') {
        return `${day}/${month}/${year}`;
    }

    const monthNamesShort = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNamesShort[monthIndex] || month;

    if (format === 'medium') {
        return `${day} ${monthName} ${year}`;
    }

    const monthNamesLong = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    const monthNameLong = monthNamesLong[monthIndex] || month;

    return `${parseInt(day, 10)} de ${monthNameLong} de ${year}`;
}
