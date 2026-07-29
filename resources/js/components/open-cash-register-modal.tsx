import { useForm, usePage } from '@inertiajs/react';
import { Wallet, AlertTriangle, Coins, RefreshCw, Landmark } from 'lucide-react';
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
    const isVenezuela = Boolean(pageProps?.isVenezuela);
    const currencySymbol = pageProps?.currencySymbol || '$';
    const currencyCode = pageProps?.currencyCode || 'MXN';

    const [isOpen, setIsOpen] = useState(false);
    const [isSyncingBcv, setIsSyncingBcv] = useState(false);

    useEffect(() => {
        if (alert?.show) {
            setIsOpen(true);
        }
    }, [alert?.show]);

    const { data, setData, post, processing, errors, reset } = useForm({
        opening_amount: '0.00',
        valor_dolar: '20.00',
    });

    const handleSyncBcv = async () => {
        setIsSyncingBcv(true);
        try {
            const res = await fetch('/admin/cajas/bcv-rate', {
                headers: {
                    'Accept': 'application/json',
                },
            });
            const result = await res.json();
            if (res.ok && result.success && result.rate) {
                setData('valor_dolar', String(result.rate));
                notifySuccess(`${__('Tasa del BCV obtenida exitosamente:')} ${result.rate} Bs.`);
            } else {
                notifyError(result.message || __('No se pudo obtener la tasa del BCV.'));
            }
        } catch (error) {
            notifyError(__('Error de conexión al consultar la tasa del BCV.'));
        } finally {
            setIsSyncingBcv(false);
        }
    };

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
                        {__('No se encuentra ninguna caja aperturada para el día de hoy. Ingrese el fondo inicial y la tasa del dólar para abrir turno.')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">{__('Apertura Requerida')}</p>
                            <p className="mt-0.5">{__('Configure el fondo en efectivo y el valor del dólar ($1 USD) para las operaciones y conversiones en tienda.')}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="opening_amount_modal" className="font-semibold">
                            {__('Monto Inicial de Fondo en Efectivo')} ({currencySymbol})
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="valor_dolar_modal" className="font-semibold flex items-center gap-1.5 text-xs">
                                <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{__('Valor del Dólar')} ($1 USD = {currencySymbol} {currencyCode})</span>
                            </Label>
                            {isVenezuela && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncBcv}
                                    disabled={isSyncingBcv}
                                    className="h-7 px-2.5 text-[11px] font-extrabold gap-1 text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shrink-0"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isSyncingBcv ? 'animate-spin' : ''}`} />
                                    {isSyncingBcv ? __('Obteniendo...') : __('Sincronizar BCV')}
                                </Button>
                            )}
                        </div>
                        <Input
                            id="valor_dolar_modal"
                            type="number"
                            step="0.0001"
                            min="0.01"
                            value={data.valor_dolar}
                            onChange={(e) => setData('valor_dolar', e.target.value)}
                            placeholder="0.00"
                            className="font-mono text-lg h-11 text-center font-bold text-emerald-600"
                            required
                        />
                        {isVenezuela && (
                            <div className="space-y-1">
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{__('Obtiene directamente la tasa oficial publicada por el Banco Central de Venezuela (BCV).')}</span>
                                </p>
                                {Number(data.valor_dolar) > 0 && (
                                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-mono">
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mb-0.5">
                                            {__('Fórmula de Conversión (USD ↔ Bs.):')}
                                        </p>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                            $580.00 USD × {Number(data.valor_dolar).toFixed(2)} = Bs. {(580 * Number(data.valor_dolar)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.valor_dolar && (
                            <p className="text-xs text-rose-500">{errors.valor_dolar}</p>
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

