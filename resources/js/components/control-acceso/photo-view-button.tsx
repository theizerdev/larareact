import { Eye, ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';

export function PhotoViewButton({ src, label }: { src: string; label?: string }) {
    const [open, setOpen] = useState(false);
    const [failed, setFailed] = useState(false);
    const { __ } = useTranslate();

    return (
        <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
                <Eye className="h-3.5 w-3.5" />
                {__('View Photo')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{label || __('Photo')}</DialogTitle>
                    </DialogHeader>
                    {failed ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
                            <ImageOff className="h-10 w-10" />
                            <p className="text-sm">{__('Photo unavailable.')}</p>
                        </div>
                    ) : (
                        <img
                            src={src}
                            alt={label || __('Photo')}
                            className="w-full rounded-lg border"
                            onError={() => setFailed(true)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
