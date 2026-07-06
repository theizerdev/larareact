
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
    colorClassName = 'bg-emerald-500', // Verde por defecto, similar a la imagen
    className,
}: ModuleHeaderProps) {
    return (
        // Contenedor principal con color de fondo, padding y bordes redondeados
        <div className={cn('p-4 rounded-lg text-white', colorClassName, className)}>
            <div className='flex items-center justify-between'>
                {/* Sección izquierda: Ícono y texto */}
                <div className='flex items-center space-x-4'>
                    <div className='p-3 bg-black bg-opacity-10 rounded-lg'>
                        {icon}
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold'>{title}</h1>
                        <p className='text-sm opacity-90'>{description}</p>
                    </div>
                </div>

                {/* Sección derecha: para botones de acción u otros elementos */}
                {children && <div>{children}</div>}
            </div>
        </div>
    );
}