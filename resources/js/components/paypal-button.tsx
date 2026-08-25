import React, { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

interface PayPalButtonProps {
    clientId: string;
    selectedCycle: number;
    extraSucursales: number;
    planId?: number;
    currency?: string;
    __: (key: string) => string;
}

declare global {
    interface Window {
        paypal?: any;
    }
}

export function PayPalButtonComponent({ clientId, selectedCycle, extraSucursales, planId, currency = 'MXN', __ }: PayPalButtonProps) {
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const selectedCycleRef = useRef(selectedCycle);
    const extraSucursalesRef = useRef(extraSucursales);
    const planIdRef = useRef(planId);

    useEffect(() => {
        selectedCycleRef.current = selectedCycle;
        extraSucursalesRef.current = extraSucursales;
        planIdRef.current = planId;
    }, [selectedCycle, extraSucursales, planId]);

    useEffect(() => {
        if (!clientId) return;

        const scriptId = 'paypal-sdk-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        const targetSrc = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;

        const renderPayPalButtons = () => {
            if (window.paypal && paypalContainerRef.current) {
                paypalContainerRef.current.innerHTML = '';
                try {
                    window.paypal.Buttons({
                        style: {
                            shape: 'rect',
                            layout: 'vertical',
                            color: 'gold',
                            label: 'paypal',
                        },
                        createOrder: async () => {
                            try {
                                const response = await fetch(`${window.location.origin}/admin/monitoring/subscription/paypal/create-order`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                    },
                                    body: JSON.stringify({
                                        plan_id: planIdRef.current,
                                        ciclo_meses: selectedCycleRef.current,
                                        sucursales_contratadas: extraSucursalesRef.current,
                                    }),
                                });
                                const orderData = await response.json();
                                if (orderData.id) {
                                    return orderData.id;
                                } else {
                                    throw new Error(orderData.error || __('Error creando orden en PayPal'));
                                }
                            } catch (err: any) {
                                Swal.fire({
                                    title: __('Error'),
                                    text: err.message || __('No se pudo iniciar el checkout de PayPal.'),
                                    icon: 'error',
                                });
                                throw err;
                            }
                        },
                        onApprove: async (data: any, actions: any) => {
                            try {
                                const response = await fetch(`${window.location.origin}/admin/monitoring/subscription/paypal/capture-order/${data.orderID}`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                    },
                                    body: JSON.stringify({
                                        plan_id: planIdRef.current,
                                        ciclo_meses: selectedCycleRef.current,
                                        sucursales_contratadas: extraSucursalesRef.current,
                                    }),
                                });
                                const captureData = await response.json();

                                const errorDetail = captureData?.details?.[0];

                                if (errorDetail?.issue === 'INSTRUMENT_DECLINED') {
                                    return actions.restart();
                                } else if (errorDetail) {
                                    throw new Error(`${errorDetail.description} (${errorDetail.issue})`);
                                } else if (captureData.error) {
                                    throw new Error(captureData.error);
                                } else if (captureData.status === 'COMPLETED') {
                                    Swal.fire({
                                        title: __('¡Pago Exitoso!'),
                                        text: __('Tu suscripción ha sido activada y extendida automáticamente.'),
                                        icon: 'success',
                                    }).then(() => {
                                        window.location.reload();
                                    });
                                } else {
                                    throw new Error(__('El pago no pudo ser capturado. Verifique la forma de pago asociada en PayPal.'));
                                }
                            } catch (err: any) {
                                Swal.fire({
                                    title: __('Error en Transacción'),
                                    text: err.message || __('No se pudo procesar la captura del pago.'),
                                    icon: 'error',
                                });
                            }
                        },
                    }).render(paypalContainerRef.current);
                } catch (e) {
                    console.error("PayPal render error:", e);
                }
            }
        };

        if (script && script.src !== targetSrc) {
            script.remove();
            script = null;
        }

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = targetSrc;
            script.async = true;
            script.onload = renderPayPalButtons;
            document.body.appendChild(script);
        } else {
            renderPayPalButtons();
        }
    }, [clientId, currency, selectedCycle, extraSucursales, planId]);

    return <div ref={paypalContainerRef} className="paypal-button-container max-w-md min-h-[150px] w-full" />;
}
