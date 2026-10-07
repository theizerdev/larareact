import { Camera, UploadCloud, X as XIcon } from 'lucide-react';
import React, { useState } from 'react';

import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';

interface ImageFieldProps {
    label: string;
    hint?: string;
    preview: string | null;
    icon: React.ReactNode;
    error?: string;
    capture?: 'user' | 'environment';
    onFile: (file: File) => void;
    onRemove?: () => void;
    id: string;
}

/** Cuadro de imagen con vista previa: subir/cambiar desde archivo o tomar con la cámara del dispositivo. */
export function ImageField({ label, hint, preview, icon, error, capture, onFile, onRemove, id }: ImageFieldProps) {
    const { __ } = useTranslate();
    const [camOpen, setCamOpen] = useState(false);
    const canLiveCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            onFile(file);
        }

        e.target.value = '';
    };

    return (
        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{label}</Label>
            <div className="relative h-40 w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                {preview ? (
                    <>
                        <img src={preview} alt={label} className="w-full h-full object-cover" />
                        {onRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                aria-label={__('Quitar foto')}
                            >
                                <XIcon className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="text-center p-3 text-slate-400">
                        <div className="mx-auto mb-1 flex justify-center">{icon}</div>
                        <span className="text-xs font-medium block">{__('Sin imagen')}</span>
                    </div>
                )}
            </div>
            {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
            <div className="grid grid-cols-2 gap-2 pt-1">
                <input type="file" accept="image/*" id={id} className="hidden" onChange={pick} />
                <label htmlFor={id} className="cursor-pointer">
                    <span className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <UploadCloud className="h-3.5 w-3.5" />
                        {preview ? __('Cambiar') : __('Subir')}
                    </span>
                </label>
                {canLiveCamera ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setCamOpen(true)}
                            className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                            <Camera className="h-3.5 w-3.5" />
                            {__('Cámara')}
                        </button>
                        <CameraCaptureDialog open={camOpen} onClose={() => setCamOpen(false)} onCapture={onFile} title={label} facing={capture} />
                    </>
                ) : (
                    <>
                    <input type="file" accept="image/*" capture={capture || 'environment'} id={`${id}_cam`} className="hidden" onChange={pick} />
                    <label htmlFor={`${id}_cam`} className="cursor-pointer">
                        <span className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                            <Camera className="h-3.5 w-3.5" />
                            {__('Cámara')}
                        </span>
                    </label>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
