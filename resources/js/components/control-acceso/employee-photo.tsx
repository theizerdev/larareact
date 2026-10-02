import { User } from 'lucide-react';
import { useState } from 'react';
import { PhotoViewButton } from '@/components/control-acceso/photo-view-button';
import { useTranslate } from '@/hooks/use-translate';

interface EmployeePhotoProps {
    /** Número de empleado del ivms; con él se arma la URL del proxy de la foto. */
    employeeNo: string;
    /** Nombre a mostrar como título del visor ampliado. */
    name?: string | null;
    /**
     * False cuando el empleado no tiene rostro enrolado (`face_photo_url` nulo en la
     * lista). Se usa para no pedir al middleware una foto que se sabe que no existe.
     */
    hasPhoto: boolean;
}

/**
 * Miniatura de la foto de referencia de un empleado del ivms. Se sirve desde el
 * proxy del backend (la `face_photo_url` del middleware apunta al terminal en la
 * LAN y no es alcanzable desde el navegador) y al hacer clic abre el visor grande,
 * que reutiliza la misma URL para no volver a descargar la imagen.
 */
export function EmployeePhoto({ employeeNo, name, hasPhoto }: EmployeePhotoProps) {
    const { __ } = useTranslate();
    const [failed, setFailed] = useState(false);

    const label = name || employeeNo;
    const src = `/admin/control-acceso/empleados/${encodeURIComponent(employeeNo)}/foto`;

    if (!hasPhoto || failed) {
        return (
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted"
                title={__('No photo')}
            >
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">{__('No photo')}</span>
            </div>
        );
    }

    return (
        <PhotoViewButton
            src={src}
            label={label}
            trigger={
                <img
                    src={src}
                    alt={label}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                    className="h-10 w-10 shrink-0 rounded-full border bg-muted object-cover"
                />
            }
        />
    );
}
