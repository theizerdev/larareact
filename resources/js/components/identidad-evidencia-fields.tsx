import { Camera, IdCard } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ImageField } from '@/components/image-field';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';

type Campo = 'foto' | 'documento_frontal' | 'documento_reverso';

export interface EvidenciaData {
    tipo_documento: string;
    foto: File | null;
    documento_frontal: File | null;
    documento_reverso: File | null;
    quitar_foto: boolean;
}

interface Props {
    /** Rutas ya guardadas (relativas a /storage) del registro que se edita. */
    existing?: Partial<Record<Campo, string | null>>;
    /** Cambia al abrir otro registro para reiniciar las vistas previas. */
    resetKey: string | number;
    setData: (fn: (prev: any) => any) => void;
    tipoDocumento: string;
    errors: Record<string, string | undefined>;
}

/** Foto + documento de identidad (frente y reverso) con cámara: lo que usan las validaciones. */
export function IdentidadEvidenciaFields({ existing, resetKey, setData, tipoDocumento, errors }: Props) {
    const { __ } = useTranslate();
    const ruta = (r?: string | null) => (r ? `/storage/${r}` : null);
    const [previews, setPreviews] = useState<Record<Campo, string | null>>({ foto: null, documento_frontal: null, documento_reverso: null });

    useEffect(() => {
        setPreviews({ foto: ruta(existing?.foto), documento_frontal: ruta(existing?.documento_frontal), documento_reverso: ruta(existing?.documento_reverso) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    const pick = (campo: Campo, file: File) => {
        setData((prev) => ({ ...prev, [campo]: file, ...(campo === 'foto' ? { quitar_foto: false } : {}) }));
        setPreviews((prev) => ({ ...prev, [campo]: URL.createObjectURL(file) }));
    };

    return (
        <div className="space-y-4 border-t pt-4">
            <div>
                <p className="text-sm font-semibold">{__('Identidad y Validación')}</p>
                <p className="text-xs text-muted-foreground">{__('La foto y el documento son los que se mandan a validar con el botón Validar.')}</p>
            </div>
            <div>
                <Label htmlFor="tipo_documento_ev">{__('Tipo de documento')}</Label>
                <Select value={tipoDocumento || 'ine'} onValueChange={(v) => setData((prev) => ({ ...prev, tipo_documento: v }))}>
                    <SelectTrigger id="tipo_documento_ev" className="mt-1.5 w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ine">{__('INE / Credencial para votar')}</SelectItem>
                        <SelectItem value="pasaporte">{__('Pasaporte / documento extranjero')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ImageField
                    id="ev_foto"
                    label={__('Foto')}
                    hint={__('Rostro de frente, bien iluminado.')}
                    preview={previews.foto}
                    icon={<Camera className="h-8 w-8 text-slate-400" />}
                    capture="user"
                    error={errors.foto}
                    onFile={(f) => pick('foto', f)}
                    onRemove={
                        previews.foto
                            ? () => {
                                  setData((prev) => ({ ...prev, foto: null, quitar_foto: true }));
                                  setPreviews((prev) => ({ ...prev, foto: null }));
                              }
                            : undefined
                    }
                />
                <ImageField
                    id="ev_doc_frente"
                    label={__('Documento Frente')}
                    preview={previews.documento_frontal}
                    icon={<IdCard className="h-8 w-8 text-slate-400" />}
                    error={errors.documento_frontal}
                    onFile={(f) => pick('documento_frontal', f)}
                />
                <ImageField
                    id="ev_doc_reverso"
                    label={__('Documento Reverso')}
                    preview={previews.documento_reverso}
                    icon={<IdCard className="h-8 w-8 text-slate-400" />}
                    error={errors.documento_reverso}
                    onFile={(f) => pick('documento_reverso', f)}
                />
            </div>
        </div>
    );
}
