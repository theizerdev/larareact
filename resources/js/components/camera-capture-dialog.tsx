import { Camera, SwitchCamera } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { attachStream } from '@/lib/camera';

interface Props {
    open: boolean;
    onClose: () => void;
    /** Recibe el fotograma como canvas ya dibujado. */
    onCapture: (canvas: HTMLCanvasElement) => void;
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
        if (open) {
            setMode(facing);
        }
    }, [open, facing]);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError(__('This browser cannot open the camera. Use HTTPS or the Upload button.'));

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
            .catch(() => setError(__('Could not access the camera. Please grant permission.')));

        return () => {
            cancelled = true;
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, stop]);

    const snap = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title ?? __('Take Photo')}</DialogTitle>
                    <DialogDescription>{__('Frame the shot and press Capture.')}</DialogDescription>
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
                        {__('Switch Camera')}
                    </Button>
                    <Button type="button" onClick={snap} disabled={!!error}>
                        <Camera className="mr-1.5 h-4 w-4" />
                        {__('Capture')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
