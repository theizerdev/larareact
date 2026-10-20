
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * @typedef StatCardProps
 * @property {React.ReactNode} icon - El componente del ícono que se mostrará.
 * @property {string} title - El título de la tarjeta de estadística.
 * @property {string | number} value - El valor que se mostrará en la tarjeta.
 * @property {string} colorClassName - Clases de Tailwind CSS para el color del ícono y su fondo.
 * @property {string} [className] - Clases CSS adicionales para personalizar el contenedor de la tarjeta.
 */
interface StatCardProps {
    icon: React.ReactNode | React.ElementType;
    title: string;
    value: string | number;
    description?: React.ReactNode;
    colorClassName?: string;
    className?: string;
}

/**
 * Un componente de tarjeta para mostrar estadísticas clave con un ícono, título y valor.
 * El color del ícono es personalizable.
 *
 * @param {StatCardProps} props - Las propiedades para renderizar la tarjeta de estadística.
 * @returns {JSX.Element} El componente de la tarjeta de estadística renderizado.
 */
export function StatCard({ icon, title, value, description, colorClassName, className }: StatCardProps) {
    const renderIcon = () => {
        if (!icon) return null;
        if (React.isValidElement(icon)) return icon;
        if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in (icon as any))) {
            const IconComp = icon as React.ComponentType<{ className?: string }>;
            return <IconComp className="h-6 w-6" />;
        }
        return icon as React.ReactNode;
    };

    return (
        // Contenedor principal de la tarjeta
        <Card className={cn('p-4', className)}>
            <div className='flex items-center space-x-4'>
                {/* Contenedor del ícono con color de fondo personalizable */}
                <div className={cn('rounded-lg p-3', colorClassName || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
                    {renderIcon()}
                </div>
                {/* Contenedor para el título y el valor */}
                <div className='flex flex-col'>
                    <span className='text-sm font-medium text-gray-500'>{title}</span>
                    <span className='text-2xl font-bold'>{value}</span>
                    {description && <span className='text-xs text-muted-foreground mt-0.5'>{description}</span>}
                </div>
            </div>
        </Card>
    );
}