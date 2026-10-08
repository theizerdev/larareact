import { router } from '@inertiajs/react';
import { Building2, FileSearch, IdCard, ScanFace, ShieldCheck, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslate } from '@/hooks/use-translate';

export type TipoValidable = 'colaborador' | 'proveedor-colaborador' | 'socio-colaborador' | 'socio-comercial' | 'visita-temporal' | 'responsable' | 'proveedor';

/**
 * normal       = validación completa de identidad (foto + documento, según las reglas de la empresa)
 * prueba_vida  = además la prueba de vida de DIDIT
 * antecedentes = antecedentes de la persona con TRUORA (CURP)
 * rfc          = antecedentes de la empresa con TRUORA (RFC), sin foto
 * curp         = nombre + CURP contra RENAPO con DIDIT, sin foto
 */
export type ModoValidacion = 'normal' | 'prueba_vida' | 'antecedentes' | 'rfc' | 'curp';

/** Proveedores y socios comerciales son empresas: se validan por RFC y a través de su responsable. */
const esEmpresa = (tipo: TipoValidable) => tipo === 'proveedor' || tipo === 'socio-comercial';

/** Lanza las validaciones del registro con los datos y evidencias ya guardados. */
export function validarPersona(tipo: TipoValidable, id: number, modo: ModoValidacion = 'normal') {
    const payload =
        modo === 'prueba_vida'
            ? { prueba_vida: 1 }
            : modo === 'antecedentes'
              ? { antecedentes: 1 }
              : modo === 'rfc' || modo === 'curp'
                ? { rapida: modo }
                : {};
    router.post(`/admin/validaciones/validar/${tipo}/${id}`, payload, { preserveScroll: true });
}

function Opcion({ icono, titulo, detalle, onClick }: { icono: ReactNode; titulo: string; detalle: string; onClick: () => void }) {
    return (
        <DropdownMenuItem onClick={onClick} className="items-start gap-2 py-2">
            <span className="mt-0.5">{icono}</span>
            <span className="flex flex-col">
                <span className="text-sm">{titulo}</span>
                <span className="text-[11px] text-muted-foreground">{detalle}</span>
            </span>
        </DropdownMenuItem>
    );
}

/** Las opciones de validación del registro, según sea empresa o persona. */
function OpcionesValidar({ tipo, id }: { tipo: TipoValidable; id: number }) {
    const { __ } = useTranslate();
    const empresa = esEmpresa(tipo);

    return (
        <>
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase text-muted-foreground">{__('Sin foto')}</DropdownMenuLabel>
            {empresa && (
                <Opcion
                    icono={<Building2 className="h-4 w-4 text-sky-600" />}
                    titulo={__('Validar empresa (RFC)')}
                    detalle={__('Antecedentes legales, fiscales y penales de la empresa · TRUORA')}
                    onClick={() => validarPersona(tipo, id, 'rfc')}
                />
            )}
            <Opcion
                icono={<IdCard className="h-4 w-4 text-teal-600" />}
                titulo={empresa ? __('Validar responsable (nombre y CURP)') : __('Validar nombre y CURP')}
                detalle={__('Que la CURP exista y corresponda al nombre · RENAPO vía DIDIT')}
                onClick={() => validarPersona(tipo, id, 'curp')}
            />
            <Opcion
                icono={<FileSearch className="h-4 w-4 text-orange-600" />}
                titulo={empresa ? __('Verificar antecedentes del responsable') : __('Verificar antecedentes')}
                detalle={__('Antecedentes penales y legales con la CURP · TRUORA')}
                onClick={() => validarPersona(tipo, id, 'antecedentes')}
            />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase text-muted-foreground">{__('Conoce a tu cliente (KYC)')}</DropdownMenuLabel>
            <Opcion
                icono={<UserCheck className="h-4 w-4 text-emerald-600" />}
                titulo={__('Validación completa de identidad')}
                detalle={__('Foto y documento de identidad, según las reglas de la empresa')}
                onClick={() => validarPersona(tipo, id)}
            />
            <Opcion
                icono={<ScanFace className="h-4 w-4 text-indigo-600" />}
                titulo={__('Validar con prueba de vida')}
                detalle={__('Selfie en vivo desde el teléfono de la persona · DIDIT')}
                onClick={() => validarPersona(tipo, id, 'prueba_vida')}
            />
        </>
    );
}

/** Submenú "Validar ▸" para meter dentro de un DropdownMenuContent existente. */
export function ValidarMenuItems({ tipo, id }: { tipo: TipoValidable; id: number }) {
    const { __ } = useTranslate();

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                {__('Validar')}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-80">
                    <OpcionesValidar tipo={tipo} id={id} />
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
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
            <DropdownMenuContent align="end" className="w-80">
                <OpcionesValidar tipo={tipo} id={id} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
