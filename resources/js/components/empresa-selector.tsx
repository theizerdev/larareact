import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslate } from '@/hooks/use-translate';

type Tenant = {
    empresa_activa_id: number | null;
    empresas: { id: number; nombre: string; logo_mini: string | null; status: boolean }[];
} | null;

/**
 * Selector del Super Administrador: entra a una empresa (todo el panel queda
 * limitado a ella) o vuelve a la vista de todas las empresas.
 */
export default function EmpresaSelector() {
    const { tenant } = usePage<{ tenant: Tenant }>().props;
    const { __ } = useTranslate();

    if (!tenant) {
        return null;
    }

    const activa = tenant.empresas.find((e) => e.id === tenant.empresa_activa_id) ?? null;

    const cambiar = (empresaId: number | null) => {
        if (empresaId === tenant.empresa_activa_id) {
            return;
        }

        router.post('/empresa-activa', { empresa_id: empresaId });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-w-[220px] gap-2">
                    {activa ? <Building2 className="size-4 shrink-0" /> : <Globe className="size-4 shrink-0" />}
                    <span className="hidden truncate sm:inline">
                        {activa ? activa.nombre : __('All companies')}
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{__('View as company')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => cambiar(null)}>
                    <Globe className="size-4" />
                    {__('All companies')}
                    {!activa && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                {tenant.empresas.map((empresa) => (
                    <DropdownMenuItem key={empresa.id} onClick={() => cambiar(empresa.id)}>
                        {empresa.logo_mini ? (
                            <img src={empresa.logo_mini} alt="" className="size-4 object-contain" />
                        ) : (
                            <Building2 className="size-4" />
                        )}
                        <span className="truncate">{empresa.nombre}</span>
                        {activa?.id === empresa.id && <Check className="ml-auto size-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
