import React, { useState, useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';

export interface SearchableOption {
    value: string;
    label: string;
    description?: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecciona una opción...',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.',
    className,
    disabled = false,
    id,
}: SearchableSelectProps) {
    const { __ } = useTranslate();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = useMemo(
        () => options.find((opt) => String(opt.value) === String(value)),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase().trim();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(q) ||
                (opt.description && opt.description.toLowerCase().includes(q))
        );
    }, [options, searchQuery]);

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setSearchQuery('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full h-9 px-3 text-xs justify-between font-normal bg-background hover:bg-slate-50 dark:hover:bg-slate-800/60 border-input shadow-xs',
                        !selectedOption && 'text-muted-foreground',
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-1.5 z-[100] shadow-md border bg-popover text-popover-foreground"
                align="start"
                sideOffset={4}
            >
                <div className="flex items-center px-2 py-1 border-b mb-1 gap-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={__(searchPlaceholder)}
                        className="h-7 text-xs border-0 focus-visible:ring-0 shadow-none px-1"
                        autoFocus
                    />
                    {searchQuery && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        'flex items-center justify-between px-2.5 py-1.5 text-xs rounded-sm cursor-pointer transition-colors',
                                        isSelected
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium'
                                            : 'hover:bg-accent hover:text-accent-foreground text-slate-700 dark:text-slate-300'
                                    )}
                                >
                                    <div className="flex flex-col truncate pr-2">
                                        <span className="truncate">{opt.label}</span>
                                        {opt.description && (
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {opt.description}
                                            </span>
                                        )}
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                            {__(emptyMessage)}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
