import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';

interface SpecPair {
    key: string;
    value: string;
}

interface SpecEditorProps {
    initialSpecs?: Record<string, any> | null;
    onChange: (specs: Record<string, string>) => void;
    title?: string;
    description?: string;
}

const COMMON_SUGGESTIONS = [
    'RAM',
    'Almacenamiento',
    'Color',
    'Pantalla',
    'Procesador',
    'Batería',
    'Salud de Batería',
    'Sistema Operativo',
    'Cámara Principal',
    'Conectividad',
    'Garantía',
    'Accesorios'
];

export default function SpecEditor({
    initialSpecs = {},
    onChange,
    title,
    description
}: SpecEditorProps) {
    const { __ } = useTranslate();

    // Ref to keep track of the JSON string representation of what we last notified to the parent
    const lastNotifiedRef = useRef<string>('');

    // Convert object to array of key-value pairs for local editing
    const [pairs, setPairs] = useState<SpecPair[]>(() => {
        if (!initialSpecs || typeof initialSpecs !== 'object') return [];
        const initialPairs = Object.entries(initialSpecs).map(([key, value]) => ({
            key,
            value: String(value ?? '')
        }));
        const cleanObj: Record<string, string> = {};
        initialPairs.forEach(p => {
            if (p.key.trim()) cleanObj[p.key.trim()] = p.value.trim();
        });
        lastNotifiedRef.current = JSON.stringify(cleanObj);
        return initialPairs;
    });

    // Sync from initialSpecs ONLY when prop changes from an external source
    useEffect(() => {
        const specsObj = (initialSpecs && typeof initialSpecs === 'object') ? initialSpecs : {};
        const cleanIncoming: Record<string, string> = {};
        Object.entries(specsObj).forEach(([k, v]) => {
            if (k.trim()) cleanIncoming[k.trim()] = String(v ?? '').trim();
        });

        const incomingJson = JSON.stringify(cleanIncoming);

        // If incoming props match our last notified JSON, skip updating local pairs to avoid erasing draft rows
        if (incomingJson === lastNotifiedRef.current) {
            return;
        }

        const newPairs = Object.entries(specsObj).map(([key, value]) => ({
            key,
            value: String(value ?? '')
        }));

        setPairs(newPairs);
        lastNotifiedRef.current = incomingJson;
    }, [initialSpecs]);

    const notifyParent = (updatedPairs: SpecPair[]) => {
        const result: Record<string, string> = {};
        updatedPairs.forEach((pair) => {
            const trimmedKey = pair.key.trim();
            if (trimmedKey) {
                result[trimmedKey] = pair.value.trim();
            }
        });
        lastNotifiedRef.current = JSON.stringify(result);
        onChange(result);
    };

    const handleAddPair = (defaultKey: string = '', defaultValue: string = '') => {
        const updated = [...pairs, { key: defaultKey, value: defaultValue }];
        setPairs(updated);
        notifyParent(updated);
    };

    const handleKeyChange = (index: number, newKey: string) => {
        const updated = [...pairs];
        updated[index] = { ...updated[index], key: newKey };
        setPairs(updated);
        notifyParent(updated);
    };

    const handleValueChange = (index: number, newValue: string) => {
        const updated = [...pairs];
        updated[index] = { ...updated[index], value: newValue };
        setPairs(updated);
        notifyParent(updated);
    };

    const handleRemovePair = (index: number) => {
        const updated = pairs.filter((_, i) => i !== index);
        setPairs(updated);
        notifyParent(updated);
    };

    return (
        <div className="space-y-3 rounded-lg border bg-slate-50/50 p-4 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                        <SlidersHorizontal className="h-4 w-4 text-blue-500" />
                        {title || __('Especificaciones Técnicas')}
                    </Label>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPair()}
                    className="h-8 text-xs gap-1"
                >
                    <Plus className="h-3.5 w-3.5" />
                    {__('Añadir Campo')}
                </Button>
            </div>

            {/* Quick suggestion pills */}
            {pairs.length < 6 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground self-center mr-1">{__('Sugerencias:')}</span>
                    {COMMON_SUGGESTIONS.filter(sug => !pairs.some(p => p.key.toLowerCase() === sug.toLowerCase())).slice(0, 5).map(sug => (
                        <button
                            key={sug}
                            type="button"
                            onClick={() => handleAddPair(sug, '')}
                            className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                        >
                            + {sug}
                        </button>
                    ))}
                </div>
            )}

            {/* List of key-value pairs */}
            {pairs.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground border border-dashed rounded-md bg-background">
                    {__('No hay especificaciones definidas. Haz clic en "+ Añadir Campo" para empezar.')}
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pairs.map((pair, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                placeholder={__('Propiedad (Ej: RAM)')}
                                value={pair.key}
                                onChange={(e) => handleKeyChange(index, e.target.value)}
                                className="h-8 text-xs flex-1 bg-background"
                            />
                            <Input
                                placeholder={__('Valor (Ej: 8GB LPDDR5)')}
                                value={pair.value}
                                onChange={(e) => handleValueChange(index, e.target.value)}
                                className="h-8 text-xs flex-1 bg-background"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePair(index)}
                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
