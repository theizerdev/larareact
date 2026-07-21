import { router } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams } from '@/lib/utils';

/**
 * Interfaz para los datos de paginación de Laravel
 */
interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    /**
     * Datos completos de la paginación devueltos por Laravel
     */
    paginatedData: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
        links: PaginationLinks[];
    };
    /**
     * Filtros actuales para mantenerlos al navegar entre páginas
     */
    filters?: Record<string, string | undefined>;
}

/**
 * Componente de paginación reutilizable compatible con la paginación de Laravel
 * Muestra los controles de navegación entre páginas y el resumen de registros
 * 
 * @param {PaginationProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de paginación
 */
const Pagination: React.FC<PaginationProps> = ({ paginatedData, filters = {} }) => {
    const { current_page, last_page, from, to, total, links } = paginatedData;
    const { __ } = useTranslate();

    /**
     * Navega a una página específica manteniendo los filtros actuales
     * @param {string | null} url - URL de la página a navegar
     */
    const handlePageChange = (url: string | null) => {
        if (!url) {
return;
}

        // Extraemos los parámetros de la URL para preservar filtros
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');

        router.get(window.location.pathname, cleanParams({
            ...filters,
            page
        }), { preserveState: true, preserveScroll: true });
    };

    /**
     * Cambia el número de registros por página
     * @param {number} perPage - Nuevo número de registros por página
     */
    const handlePerPageChange = (perPage: number) => {
        router.get(window.location.pathname, cleanParams({
            ...filters,
            perPage
        }), { preserveState: true, preserveScroll: true });
    };

    // Si solo hay una página, no mostramos la paginación
    if (last_page <= 1) {
return null;
}

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 bg-white dark:bg-slate-900 rounded-lg border">
            {/* Resumen de registros */}
            <div className="text-sm text-muted-foreground">
                {__('Showing :from to :to of :total records', {
                    from: String(from || 0),
                    to: String(to || 0),
                    total: String(total || 0)
                })}
            </div>

            {/* Selector de registros por página */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{__('Records per page:')}</span>
                <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={paginatedData.per_page}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-1">
                {links.map((link, index) => {
                    // Estilos para los botones de paginación
                    const isActive = link.active;
                    const isDisabled = !link.url;

                    // Omitimos los links de "..." para mantener la UI limpia
                    if (link.label === '...') {
                        return <span key={index} className="px-3 py-2">...</span>;
                    }

                    return (
                        <Button
                            key={index}
                            variant={isActive ? "default" : "secondary"}
                            size="sm"
                            disabled={isDisabled}
                            onClick={() => handlePageChange(link.url)}
                            className="min-w-[40px]"
                        >
                            {link.label === "&laquo; Previous" ? __('Previous') :
                                link.label === "Next &raquo;" ? __('Next') : link.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default Pagination;