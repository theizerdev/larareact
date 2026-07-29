import { useForm, usePage } from '@inertiajs/react';
import { Wallet, AlertTriangle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

export function OpenCashRegisterModal() {
    const { __ } = useTranslate();
    const pageProps = usePage().props as any;
    const alert = pageProps?.cash_register_alert;

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (alert?.show) {
            setIsOpen(true);
        }
    }, [alert?.show]);

    const { data, setData, post, processing, errors, reset } = useForm({
        opening_amount: '0.00',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/cajas', {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                notifySuccess(__('Caja aperturada exitosamente.'));
            },
            onError: () => {
                notifyError(__('Ocurrió un error al aperturar la caja.'));
            },
        });
    };

    if (!alert?.show) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Wallet className="w-5 h-5 text-indigo-600" />
                        {__('Apertura de Caja del Día')}
                    </DialogTitle>
                    <DialogDescription>
                        {__('Atención Administrador: No se encuentra ninguna caja aperturada para el día de hoy en su empresa. Ingrese el fondo inicial para abrir turno.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">{__('Apertura Requerida')}</p>
                            <p className="mt-0.5">{__('Registrar el fondo en efectivo facilitará el control de arqueo y registro de operaciones del día.')}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening_amount_modal" className="font-semibold">
                            {__('Monto Inicial de Fondo ($)')}
                        </Label>
                        <Input
                            id="opening_amount_modal"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.opening_amount}
                            onChange={(e) => setData('opening_amount', e.target.value)}
                            placeholder="0.00"
                            className="font-mono text-xl h-12 text-center font-bold text-indigo-600"
                            autoFocus
                            required
                        />
                        {errors.opening_amount && (
                            <p className="text-xs text-rose-500">{errors.opening_amount}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            {__('Omitir por ahora')}
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            <Wallet className="w-4 h-4 mr-2" />
                            {processing ? __('Aperturando...') : __('Aperturar Caja Ahora')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
