import { Camera, SwitchCamera } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { attachStream } from '@/lib/camera';

interface Props {
    open: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    title?: string;
    facing?: 'user' | 'environment';
}

/** Cámara en vivo (getUserMedia) para tomar una foto desde PC o celular. */
export function CameraCaptureDialog({ open, onClose, onCapture, title, facing = 'user' }: Props) {
    const { __ } = useTranslate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [mode, setMode] = useState<'user' | 'environment'>(facing);
    const [error, setError] = useState<string | null>(null);

    const stop = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError(__('Este navegador no permite abrir la cámara. Usa HTTPS o el botón Subir.'));

            return;
        }

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
            .then((stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());

                    return;
                }

                stop();
                streamRef.current = stream;
                attachStream(videoRef, stream);
            })
            .catch(() => setError(__('No se pudo acceder a la cámara. Por favor otorgue permisos.')));

        return () => {
            cancelled = true;
            stop();
        };
    }, [open, mode, stop, __]);

    const snap = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    onCapture(new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' }));
                    onClose();
                }
            },
            'image/jpeg',
            0.9,
        );
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title ?? __('Tomar foto')}</DialogTitle>
                    <DialogDescription>{__('Encuadra y presiona Capturar.')}</DialogDescription>
                </DialogHeader>
                {error ? (
                    <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</p>
                ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`h-full w-full object-cover ${mode === 'user' ? 'scale-x-[-1]' : ''}`}
                        />
                    </div>
                )}
                <div className="flex justify-between gap-2">
                    <Button type="button" variant="outline" onClick={() => setMode(mode === 'user' ? 'environment' : 'user')}>
                        <SwitchCamera className="mr-1.5 h-4 w-4" />
                        {__('Cambiar Cámara')}
                    </Button>
                    <Button type="button" onClick={snap} disabled={!!error}>
                        <Camera className="mr-1.5 h-4 w-4" />
                        {__('Capturar')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
