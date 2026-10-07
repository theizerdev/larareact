import { router } from '@inertiajs/react';
import { FileSearch, ScanFace, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslate } from '@/hooks/use-translate';

export type TipoValidable = 'colaborador' | 'proveedor-colaborador' | 'socio-colaborador' | 'socio-comercial' | 'visita-temporal' | 'responsable' | 'proveedor';

/** Lanza las validaciones del registro con los datos y evidencias ya guardados. */
export function validarPersona(tipo: TipoValidable, id: number, modo: 'normal' | 'prueba_vida' | 'antecedentes' = 'normal') {
    const payload = modo === 'prueba_vida' ? { prueba_vida: 1 } : modo === 'antecedentes' ? { antecedentes: 1 } : {};
    router.post(`/admin/validaciones/validar/${tipo}/${id}`, payload, { preserveScroll: true });
}

/** Opciones para meter dentro de un DropdownMenuContent existente. */
export function ValidarMenuItems({ tipo, id }: { tipo: TipoValidable; id: number }) {
    const { __ } = useTranslate();

    return (
        <>
            <DropdownMenuItem onClick={() => validarPersona(tipo, id)}>
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                {__('Validar')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => validarPersona(tipo, id, 'prueba_vida')}>
                <ScanFace className="mr-2 h-4 w-4 text-indigo-600" />
                {__('Validar con prueba de vida')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => validarPersona(tipo, id, 'antecedentes')}>
                <FileSearch className="mr-2 h-4 w-4 text-orange-600" />
                {__('Verificar antecedentes')}
            </DropdownMenuItem>
        </>
    );
}

/** Botón de ícono con las mismas opciones, para filas que no usan menú de acciones. */
export function ValidarButton({ tipo, id }: { tipo: TipoValidable; id: number }) {
    const { __ } = useTranslate();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" title={__('Validar')}>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <ValidarMenuItems tipo={tipo} id={id} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
