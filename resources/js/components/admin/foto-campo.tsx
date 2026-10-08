import { Camera, ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';

const LADO_MAXIMO = 1600;

/** Reduce la imagen y la devuelve como data-URL JPEG para no enviar fotos de varios MB. */
function reducir(origen: CanvasImageSource, ancho: number, alto: number): string {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(ancho, alto));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);
    canvas.getContext('2d')?.drawImage(origen, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.85);
}

function archivoADataUrl(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            resolve(reducir(img, img.naturalWidth, img.naturalHeight));
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('imagen no válida'));
        };
        img.src = url;
    });
}

interface Props {
    label: string;
    value: string | null | undefined;
    onChange: (valor: string) => void;
    error?: string;
    required?: boolean;
    /** 'user' = cámara frontal (rostros), 'environment' = trasera (documentos). */
    camara?: 'user' | 'environment';
    ayuda?: string;
    redonda?: boolean;
}

export function FotoCampo({ label, value, onChange, error, required, camara = 'environment', ayuda, redonda }: Props) {
    const { __ } = useTranslate();
    const inputRef = useRef<HTMLInputElement>(null);
    const camaraInputRef = useRef<HTMLInputElement>(null);
    const [camaraAbierta, setCamaraAbierta] = useState(false);
    const [fallo, setFallo] = useState<string | null>(null);

    const src = value || null;
    const hayCamara = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    const alElegir = async (archivo: File | undefined) => {
        if (!archivo) return;
        setFallo(null);
        try {
            onChange(await archivoADataUrl(archivo));
        } catch {
            setFallo(__('The image is not valid. Use a JPG, PNG or WEBP photo of up to 8 MB.'));
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Label className="font-semibold">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[200px] bg-slate-50/50 dark:bg-slate-900/10">
                {(
                    <>
                        {src ? (
                            <img
                                src={src}
                                alt={label}
                                className={redonda ? 'w-32 h-32 rounded-full object-cover border shadow-sm' : 'max-h-40 max-w-full rounded-md object-contain border shadow-sm'}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                                <ImageIcon className="w-10 h-10 text-slate-300" />
                                <span className="text-xs max-w-[220px]">{ayuda ?? __('Upload a photo or capture one using your camera')}</span>
                            </div>
                        )}
                        <div className="flex gap-2 flex-wrap justify-center">
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    void alElegir(e.target.files?.[0]);
                                    e.target.value = '';
                                }}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                                {src ? <RotateCcw className="w-3 h-3 mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                                {src ? __('Replace') : __('Upload')}
                            </Button>
                            {hayCamara ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setCamaraAbierta(true)}>
                                    <Camera className="w-3 h-3 mr-1" />
                                    {__('Take Photo')}
                                </Button>
                            ) : (
                                <>
                                    <input
                                        ref={camaraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture={camara}
                                        className="hidden"
                                        onChange={(e) => {
                                            void alElegir(e.target.files?.[0]);
                                            e.target.value = '';
                                        }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => camaraInputRef.current?.click()}>
                                        <Camera className="w-3 h-3 mr-1" />
                                        {__('Take Photo')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                )}
                <CameraCaptureDialog
                    open={camaraAbierta}
                    onClose={() => setCamaraAbierta(false)}
                    onCapture={(canvas) => onChange(reducir(canvas, canvas.width, canvas.height))}
                    title={label}
                    facing={camara}
                />
            </div>
            {(error || fallo) && <p className="text-xs text-red-500">{error ?? fallo}</p>}
        </div>
    );
}
