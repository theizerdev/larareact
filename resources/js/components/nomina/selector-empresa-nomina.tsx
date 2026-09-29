import { router } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface EmpresaElegible {
    id: number;
    razon_social: string;
}

interface Props {
    empresaId: number;
    empresas: EmpresaElegible[];
}

/**
 * Selector de empresa del módulo de Nómina, sólo para el Super Administrador.
 *
 * Con la lista vacía no pinta nada: un usuario de empresa trabaja siempre
 * sobre la suya. La elección se guarda en la sesión del lado del servidor,
 * así que basta con recargar la pantalla actual con ?empresa_id=. Los filtros
 * de la URL (período, estado) se descartan a propósito: cada empresa tiene su
 * propio calendario de nómina.
 */
export function SelectorEmpresaNomina({ empresaId, empresas }: Props) {
    if (empresas.length === 0) {
        return null;
    }

    return (
        <Select
            value={String(empresaId)}
            onValueChange={(valor) => router.get(window.location.pathname, { empresa_id: valor })}
        >
            <SelectTrigger
                aria-label="Empresa"
                className="w-full border-white/40 bg-white/10 text-white sm:w-64 [&_svg]:text-white"
            >
                <Building2 className="mr-2 h-4 w-4 shrink-0" />
                <SelectValue placeholder="Elige una empresa" />
            </SelectTrigger>
            <SelectContent>
                {empresas.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                        {e.razon_social}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
