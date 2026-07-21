import { ChevronDown, Search } from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Genera el emoji de bandera a partir del código ISO2 del país.
 * Funciona combinando los Regional Indicator Symbols de cada letra.
 */
function getFlagEmoji(iso2?: string | null): string {
    if (!iso2 || iso2.length !== 2) {
return '🌐';
}

    return iso2
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 65)))
        .join('');
}

/**
 * Normaliza el código telefónico: quita cualquier '+' inicial y devuelve '+XX'.
 */
function formatCode(codigoTelefonico?: string | null): string {
    if (!codigoTelefonico) {
return '';
}

    const clean = codigoTelefonico.replace(/^\+/, '');

    return `+${clean}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PaisPhoneOption {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
}

interface PhoneInputGroupProps {
    paises: PaisPhoneOption[];
    /** ID del país seleccionado para el prefijo (estado externo) */
    selectedPaisId: string | number;
    /** Número de teléfono (sin prefijo) */
    phoneValue: string;
    onPaisChange: (paisId: string | number) => void;
    onPhoneChange: (phone: string) => void;
    placeholder?: string;
    error?: string;
    className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PhoneInputGroup({
    paises,
    selectedPaisId,
    phoneValue,
    onPaisChange,
    onPhoneChange,
    placeholder = '000-0000000',
    error,
    className,
}: PhoneInputGroupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef  = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedPais = paises.find((p) => p.id === Number(selectedPaisId));
    const flag = getFlagEmoji(selectedPais?.codigo_iso2);
    const code = formatCode(selectedPais?.codigo_telefonico);

    // Filtra países por nombre, código ISO2 o código telefónico
    const filtered = useMemo(() => {
        const q = search.toLowerCase().replace(/^\+/, '');

        if (!q) {
return paises;
}

        return paises.filter(
            (p) =>
                p.nombre.toLowerCase().includes(q) ||
                (p.codigo_iso2 ?? '').toLowerCase().includes(q) ||
                (p.codigo_telefonico ?? '').replace(/^\+/, '').includes(q),
        );
    }, [paises, search]);

    // Cierra el dropdown al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Enfoca el buscador al abrir y limpia al cerrar
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchRef.current?.focus(), 60);
        } else {
            setSearch('');
        }
    }, [isOpen]);

    const handleSelect = (paisId: string | number) => {
        onPaisChange(paisId);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* ── Input group: [🏴 +58 ▾] [número] ── */}
            <div
                className={cn(
                    'flex w-full rounded-md border bg-background ring-offset-background',
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    error ? 'border-destructive' : 'border-input',
                )}
            >
                {/* Selector de país (bandera + código) */}
                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    className={cn(
                        'flex shrink-0 items-center gap-1.5 pl-3 pr-2 h-9',
                        'rounded-l-md border-r border-input bg-muted/50',
                        'text-sm font-medium text-foreground',
                        'hover:bg-muted transition-colors',
                        'focus:outline-none',
                    )}
                >
                    <span className="text-base leading-none select-none">
                        {selectedPaisId ? flag : '🌐'}
                    </span>
                    <span className="tabular-nums text-xs text-muted-foreground min-w-[32px]">
                        {code || '+ --'}
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                            isOpen && 'rotate-180',
                        )}
                    />
                </button>

                {/* Input del número de teléfono */}
                <input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'flex-1 h-9 min-w-0 bg-transparent px-3 py-1 text-sm',
                        'placeholder:text-muted-foreground',
                        'rounded-r-md',
                        'focus:outline-none',
                    )}
                />
            </div>

            {/* ── Dropdown con buscador ── */}
            {isOpen && (
                <div
                    className={cn(
                        'absolute top-[calc(100%+4px)] left-0 z-50 w-72',
                        'rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
                        'overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100',
                    )}
                >
                    {/* Buscador */}
                    <div className="sticky top-0 p-2 border-b border-border bg-popover">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar país o código..."
                                className={cn(
                                    'w-full pl-8 pr-3 py-1.5 text-sm',
                                    'bg-muted rounded-md',
                                    'border border-input',
                                    'outline-none focus:ring-1 focus:ring-ring',
                                    'placeholder:text-muted-foreground',
                                )}
                            />
                        </div>
                    </div>

                    {/* Lista de países */}
                    <div className="max-h-56 overflow-y-auto overscroll-contain">
                        {/* Opción "sin país" */}
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                                'hover:bg-accent hover:text-accent-foreground transition-colors',
                                !selectedPaisId && 'bg-accent/60 font-medium',
                            )}
                        >
                            <span className="text-base w-6 leading-none select-none">🌐</span>
                            <span className="text-muted-foreground italic">Sin país</span>
                        </button>

                        {filtered.map((pais) => {
                            const isSelected = Number(selectedPaisId) === pais.id;

                            return (
                                <button
                                    type="button"
                                    key={pais.id}
                                    onClick={() => handleSelect(pais.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                                        'hover:bg-accent hover:text-accent-foreground transition-colors',
                                        isSelected && 'bg-accent/60 font-medium',
                                    )}
                                >
                                    <span className="text-base w-6 leading-none select-none shrink-0">
                                        {getFlagEmoji(pais.codigo_iso2)}
                                    </span>
                                    <span className="flex-1 truncate">{pais.nombre}</span>
                                    {pais.codigo_telefonico && (
                                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                            {formatCode(pais.codigo_telefonico)}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {filtered.length === 0 && (
                            <p className="px-3 py-5 text-sm text-center text-muted-foreground">
                                No se encontraron países
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}
