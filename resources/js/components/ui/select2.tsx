import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Select2Option {
    value: string;
    label: string;
    sublabel?: string;
    badge?: string;
    badgeColor?: string;
    avatar?: string;
    icon?: React.ReactNode;
    color?: string;
    disabled?: boolean;
}

interface Select2Props {
    options: Select2Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "default" | "lg";
}

export function Select2({
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar opción...",
    searchPlaceholder = "Buscar en la lista...",
    emptyText = "No se encontraron resultados",
    disabled = false,
    className,
    size = "default",
}: Select2Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = useMemo(
        () => options.find((opt) => opt.value === value),
        [options, value]
    );

    // Filtered options based on search input
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const lower = searchTerm.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(lower) ||
                (opt.sublabel && opt.sublabel.toLowerCase().includes(lower)) ||
                (opt.badge && opt.badge.toLowerCase().includes(lower))
        );
    }, [options, searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger Container */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 text-left transition-all outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 shadow-xs hover:bg-muted/20",
                    size === "sm" && "h-9 text-xs",
                    size === "default" && "h-11 text-sm",
                    size === "lg" && "h-12 text-base",
                    isOpen && "border-primary ring-2 ring-primary/30",
                    className
                )}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                    {selectedOption ? (
                        <>
                            {/* Color circle or Avatar */}
                            {selectedOption.avatar ? (
                                <Avatar className="h-6 w-6 shrink-0 border">
                                    <AvatarImage src={selectedOption.avatar} alt={selectedOption.label} />
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                        {selectedOption.label.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ) : selectedOption.color ? (
                                <span
                                    className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                                    style={{ backgroundColor: selectedOption.color }}
                                />
                            ) : selectedOption.icon ? (
                                <span className="shrink-0 text-muted-foreground">{selectedOption.icon}</span>
                            ) : null}

                            {/* Label & Sublabel preview */}
                            <span className="font-medium text-foreground truncate">
                                {selectedOption.label}
                            </span>

                            {selectedOption.badge && (
                                <Badge
                                    variant="secondary"
                                    className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                                >
                                    {selectedOption.badge}
                                </Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground truncate">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </div>
            </button>

            {/* Dropdown Menu (Select2 Style) */}
            {isOpen && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[280px] rounded-2xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 overflow-hidden">
                    {/* Search Input Box */}
                    <div className="p-2 border-b bg-muted/30 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="pl-9 h-9 rounded-xl text-xs bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                {emptyText}
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={option.disabled}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-3 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer",
                                            isSelected
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "hover:bg-muted text-foreground",
                                            option.disabled && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {/* Avatar or Icon */}
                                            {option.avatar ? (
                                                <Avatar className="h-7 w-7 shrink-0 border">
                                                    <AvatarImage src={option.avatar} alt={option.label} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                                        {option.label.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : option.color ? (
                                                <span
                                                    className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                                                    style={{ backgroundColor: option.color }}
                                                />
                                            ) : option.icon ? (
                                                <span className="shrink-0 text-muted-foreground">{option.icon}</span>
                                            ) : null}

                                            {/* Main Text & Subtitle */}
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm truncate flex items-center gap-2">
                                                    <span>{option.label}</span>
                                                </div>
                                                {option.sublabel && (
                                                    <div className="text-[11px] text-muted-foreground truncate">
                                                        {option.sublabel}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {option.badge && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                                                >
                                                    {option.badge}
                                                </Badge>
                                            )}

                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
