import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Eye, ImageOff, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface PhotoViewButtonProps {
    /** URL de la única foto disponible. Se ignora si se pasa `photoIndexUrl`. */
    src?: string;
    /** Construye la URL de la foto en un índice dado (0-based), para eventos con varias capturas. */
    photoIndexUrl?: (index: number) => string;
    /** Cantidad total de fotos disponibles (por defecto 1). */
    count?: number;
    label?: string;
}

/**
 * Visor de fotos del evento. Con más de una foto, las muestra todas a la vez en
 * una grilla (hasta 3 columnas en pantallas grandes) dentro de un panel expandido,
 * en vez de un carrusel de una foto a la vez, para poder compararlas de un vistazo.
 * Usa los primitivos de Radix directamente (no el Dialog compartido de ui/) para
 * que este estilo de panel grande y traslúcido no afecte a los demás diálogos de la app.
 */
export function PhotoViewButton({ src, photoIndexUrl, count = 1, label }: PhotoViewButtonProps) {
    const [open, setOpen] = useState(false);
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
    const { __ } = useTranslate();

    const total = Math.max(1, count);
    const indices = Array.from({ length: total }, (_, i) => i);
    const resolveSrc = (index: number) => (photoIndexUrl ? photoIndexUrl(index) : src);

    const handleOpenChange = (next: boolean) => {
        setOpen(next);

        if (!next) {
            setFailedIndices(new Set());
        }
    };

    const markFailed = (index: number) => {
        setFailedIndices((prev) => new Set(prev).add(index));
    };

    const gridColsClass =
        total === 1 ? 'grid-cols-1' : total === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    return (
        <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                <Eye className="h-3.5 w-3.5" />
                {__('View Photo')}
                {total > 1 && <span className="text-xs text-muted-foreground">({total})</span>}
            </Button>
            <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content
                        className={cn(
                            'fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl border bg-background/95 shadow-2xl backdrop-blur',
                            'sm:inset-8 lg:inset-12',
                            'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2 border-b p-4">
                            <div>
                                <DialogPrimitive.Title className="font-semibold text-foreground">{label || __('Photo')}</DialogPrimitive.Title>
                                {total > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                        {total} {__('Photos')}
                                    </p>
                                )}
                            </div>
                            <DialogPrimitive.Close className="rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden">
                                <X className="h-5 w-5" />
                                <span className="sr-only">{__('Close')}</span>
                            </DialogPrimitive.Close>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className={cn('grid h-full auto-rows-fr gap-4', gridColsClass)}>
                                {indices.map((i) => {
                                    const photoSrc = resolveSrc(i);
                                    const failed = failedIndices.has(i);

                                    return (
                                        <div key={i} className="flex min-h-64 flex-col gap-1.5">
                                            {failed ? (
                                                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border bg-muted/30 p-6 text-muted-foreground">
                                                    <ImageOff className="h-8 w-8" />
                                                    <p className="text-xs">{__('Photo unavailable.')}</p>
                                                </div>
                                            ) : (
                                                <img
                                                    src={photoSrc}
                                                    alt={`${label || __('Photo')} ${i + 1}`}
                                                    className="min-h-0 w-full flex-1 rounded-lg border bg-muted/20 object-contain"
                                                    onError={() => markFailed(i)}
                                                />
                                            )}
                                            {total > 1 && (
                                                <span className="text-center text-xs text-muted-foreground">
                                                    {i + 1} / {total}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </>
    );
}
