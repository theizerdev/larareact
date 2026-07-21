
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
    icon: React.ReactNode;
    title: string;
    value: string | number;
    colorClassName: string;
    className?: string;
}

/**
 * Un componente de tarjeta para mostrar estadísticas clave con un ícono, título y valor.
 * El color del ícono es personalizable.
 *
 * @param {StatCardProps} props - Las propiedades para renderizar la tarjeta de estadística.
 * @returns {JSX.Element} El componente de la tarjeta de estadística renderizado.
 */
export function StatCard({ icon, title, value, colorClassName, className }: StatCardProps) {
    return (
        // Contenedor principal de la tarjeta
        <Card className={cn('p-4', className)}>
            <div className='flex items-center space-x-4'>
                {/* Contenedor del ícono con color de fondo personalizable */}
                <div className={cn('rounded-lg p-3', colorClassName)}>
                    {icon}
                </div>
                {/* Contenedor para el título y el valor */}
                <div className='flex flex-col'>
                    <span className='text-sm font-medium text-gray-500'>{title}</span>
                    <span className='text-2xl font-bold'>{value}</span>
                </div>
            </div>
        </Card>
    );
}