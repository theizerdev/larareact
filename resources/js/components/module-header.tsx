import React from 'react';
import { cn } from '@/lib/utils';

/**
 * @typedef ModuleHeaderProps
 * @property {React.ReactNode} icon - El componente del ícono que se mostrará a la izquierda del título.
 * @property {string} title - El título principal de la cabecera del módulo.
 * @property {string} description - Una breve descripción que aparece debajo del título.
 * @property {React.ReactNode} [children] - Elementos hijos, típicamente botones de acción, que se mostrarán a la derecha.
 * @property {string} [colorClassName] - Clases de Tailwind CSS para el color de fondo de la cabecera.
 * @property {string} [className] - Clases CSS adicionales para personalizar el contenedor principal.
 */
interface ModuleHeaderProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children?: React.ReactNode;
    colorClassName?: string;
    className?: string;
}

/**
 * Un componente de cabecera para módulos de la aplicación. Muestra un ícono, título,
 * descripción y permite añadir botones de acción. El color de fondo es personalizable.
 *
 * @param {ModuleHeaderProps} props - Las propiedades para renderizar la cabecera del módulo.
 * @returns {JSX.Element} El componente de la cabecera del módulo renderizado.
 */
export function ModuleHeader({
    icon,
    title,
    description,
    children,
    colorClassName = 'bg-emerald-500',
    className,
}: ModuleHeaderProps) {
    return (
        <div className={cn('p-4 sm:p-6 rounded-2xl text-white shadow-md relative overflow-hidden', colorClassName, className)}>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                {/* Sección izquierda: Ícono y texto */}
                <div className='flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                    <div className='p-3 bg-black/20 rounded-xl shrink-0 flex items-center justify-center'>
                        {icon}
                    </div>
                    <div className='min-w-0 flex-1 space-y-0.5'>
                        <h1 className='text-lg sm:text-2xl font-extrabold tracking-tight leading-snug break-words'>
                            {title}
                        </h1>
                        <p className='text-xs sm:text-sm text-white/90 font-medium leading-relaxed break-words'>
                            {description}
                        </p>
                    </div>
                </div>

                {/* Sección derecha: Botones de acción (adaptable a móvil) */}
                {children && (
                    <div className='shrink-0 flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end border-t border-white/10 sm:border-t-0 pt-3 sm:pt-0'>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}