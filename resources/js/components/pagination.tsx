import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

export interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    links?: PaginationLinks[];
}

export interface PaginationProps {
    paginatedData: PaginatedData;
    filters?: Record<string, string | undefined>;
    className?: string;
}

export default function Pagination({
    paginatedData,
    filters = {},
    className = ''
}: PaginationProps) {
    const { __ } = useTranslate();
    const { current_page, last_page, per_page, total, from, to } = paginatedData;

    // Direct page navigation helper
    const goToPage = (page: number) => {
        if (page < 1 || page > last_page || page === current_page) return;

        router.get(
            window.location.pathname,
            cleanParams({
                ...filters,
                page: String(page)
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    // Change perPage helper
    const handlePerPageChange = (newPerPage: string) => {
        router.get(
            window.location.pathname,
            cleanParams({
                ...filters,
                perPage: newPerPage,
                page: '1' // Reset to page 1 on perPage change
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    // Generate page numbers window (e.g. 1 ... 4 5 6 ... 10)
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = 5;

        if (last_page <= maxVisible + 2) {
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, current_page - 1);
            let end = Math.min(last_page, current_page + 1);

            if (current_page <= 3) {
                end = 4;
            } else if (current_page >= last_page - 2) {
                start = last_page - 3;
            }

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('ellipsis');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < last_page) {
                if (end < last_page - 1) pages.push('ellipsis');
                pages.push(last_page);
            }
        }

        return pages;
    };

    if (!total || total <= 0) return null;

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-card text-card-foreground rounded-lg border shadow-sm ${className}`}>
            {/* Left: Summary info */}
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                {__('Mostrando')} <span className="font-semibold text-foreground">{from || 0}</span> {__('a')}{' '}
                <span className="font-semibold text-foreground">{to || 0}</span> {__('de')}{' '}
                <span className="font-semibold text-foreground">{total}</span> {__('registros')}
            </div>

            {/* Right: Controls section */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Per Page Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{__('Por página:')}</span>
                    <Select value={String(per_page)} onValueChange={handlePerPageChange}>
                        <SelectTrigger className="h-8 w-[70px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Page Navigation Buttons (Only if last_page > 1) */}
                {last_page > 1 && (
                    <div className="flex items-center gap-1">
                        {/* First Page Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hidden sm:inline-flex"
                            disabled={current_page === 1}
                            onClick={() => goToPage(1)}
                            title={__('Primera página')}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Previous Page Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={current_page === 1}
                            onClick={() => goToPage(current_page - 1)}
                            title={__('Página anterior')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Numbered Page Buttons */}
                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((page, idx) => {
                                if (page === 'ellipsis') {
                                    return (
                                        <div
                                            key={`ellipsis-${idx}`}
                                            className="h-8 w-8 flex items-center justify-center text-muted-foreground"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </div>
                                    );
                                }

                                const isActive = page === current_page;
                                return (
                                    <Button
                                        key={page}
                                        type="button"
                                        variant={isActive ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => goToPage(page)}
                                        className={`h-8 min-w-[32px] px-2 text-xs ${
                                            isActive ? 'font-semibold shadow-sm pointer-events-none' : ''
                                        }`}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Next Page Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={current_page === last_page}
                            onClick={() => goToPage(current_page + 1)}
                            title={__('Página siguiente')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Last Page Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hidden sm:inline-flex"
                            disabled={current_page === last_page}
                            onClick={() => goToPage(last_page)}
                            title={__('Última página')}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}