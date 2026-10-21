import { Camera, CheckCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';

interface CameraWidgetProps {
    onCapture: (base64Data: string) => void;
    onCancel: () => void;
    /** Óvalo para encuadrar el rostro de frente (fotos para el reloj checador). */
    faceGuide?: boolean;
}

export function CameraWidget({ onCapture, onCancel, faceGuide = false }: CameraWidgetProps) {
    const { __ } = useTranslate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    const startCamera = async () => {
        setError(null);
        setCaptured(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error(err);
            setError(__('No webcam access or camera not found'));
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg');
                setCaptured(base64);
                stopCamera();
            }
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center gap-3">
            {error && (
                <div className="text-red-500 flex flex-col items-center gap-2 text-center text-sm py-4">
                    <ShieldAlert className="w-8 h-8" />
                    <span>{error}</span>
                </div>
            )}

            {!error && !captured && (
                <div className="relative w-full max-w-[320px] aspect-[4/3] bg-black rounded-md overflow-hidden border">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {faceGuide && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
                            <div className="h-[72%] aspect-[3/4] rounded-[50%] border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                        </div>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={capture}
                            className="bg-primary text-primary-foreground shadow-md flex items-center gap-1.5"
                        >
                            <Camera className="w-4 h-4" />
                            {__('Capture Snapshot')}
                        </Button>
                    </div>
                </div>
            )}

            {captured && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full max-w-[320px] aspect-[4/3] rounded-md overflow-hidden border">
                        <img src={captured} alt="Captured preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startCamera()}
                            className="flex items-center gap-1"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {__('Retake')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onCapture(captured)}
                            className="flex items-center gap-1"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {__('Save')}
                        </Button>
                    </div>
                </div>
            )}

            <Button type="button" variant="ghost" size="xs" onClick={onCancel} className="text-muted-foreground mt-1">
                {__('Cancel')}
            </Button>
        </div>
    );
}
