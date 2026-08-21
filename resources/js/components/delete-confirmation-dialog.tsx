import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

/**
 * @typedef DeleteConfirmationDialogProps
 * @property {boolean} isOpen - Controla si el diálogo está abierto o cerrado.
 * @property {() => void} onClose - Función que se llama al cerrar o cancelar el diálogo.
 * @property {() => void} onConfirm - Función que se llama al confirmar la acción.
 * @property {string} [title] - El título que se mostrará en el diálogo.
 * @property {string} [description] - La descripción o mensaje de advertencia del diálogo.
 * @property {boolean} [isConfirming] - Indica si la acción de confirmación está en proceso (ej. mostrando un spinner).
 */
interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isConfirming?: boolean;
}

/**
 * Un componente de diálogo de confirmación reutilizable construido con Radix UI AlertDialog.
 * Está diseñado para acciones destructivas, requiriendo una confirmación explícita del usuario.
 *
 * @param {DeleteConfirmationDialogProps} props
 * @returns {JSX.Element}
 */
export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás absolutamente seguro?',
    description = 'Esta acción no se puede deshacer. Esto eliminará permanentemente los datos de nuestros servidores.',
    isConfirming = false,
}: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" onClick={onClose} disabled={isConfirming}>
                            Cancelar
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button variant="destructive" onClick={onConfirm} disabled={isConfirming}>
                            {isConfirming ? 'Eliminando...' : 'Confirmar Eliminación'}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}