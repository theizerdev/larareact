import { Head, useForm, router } from '@inertiajs/react';
import {
    Settings2, MessageSquare, QrCode, RefreshCw, Power, Send, Key,
    Database, AlertTriangle, CheckCircle2, Copy, Check, Activity, Phone,
    Wifi, WifiOff, Smartphone, Zap, Shield, Info, Clock
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';
import type { PaisPhoneOption } from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import PhoneInputGroup from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import { WelcomeWhatsAppModal } from '@/components/welcome-whatsapp-modal';

interface LiveStatus {
    isConnected: boolean;
    connectionState: string;
    qrCode: string | null;
    token?: string | null;
    user: {
        id: string;
        name?: string;
    } | null;
    lastSeen: string | null;
    reconnectAttempts: number;
    _error?: string;
}

interface PageProps {
    empresa_id: number;
    empresa_nombre: string;
    whatsapp_api_key: string | null;
    whatsapp_api_url: string;
    whatsapp_instance?: string;
    whatsapp_rate_limit: number;
    whatsapp_active: boolean;
    whatsapp_phone: string | null;
    whatsapp_status: string | null;
    live_status: LiveStatus | null;
    paises: PaisPhoneOption[];
    is_superadmin: boolean;
    subscription_status: string | null;
    trial_ends_at: string | null;
    dias_restantes: number;
    is_on_trial: boolean;
}

export default function WhatsAppIntegration({
    empresa_id,
    empresa_nombre,
    whatsapp_api_key,
    whatsapp_api_url,
    whatsapp_instance = '',
    whatsapp_rate_limit,
    whatsapp_active,
    whatsapp_phone,
    whatsapp_status,
    live_status,
    paises,
    is_superadmin,
    subscription_status,
    trial_ends_at,
    dias_restantes,
    is_on_trial,
}: PageProps) {
    const { __ } = useTranslate();
    const [copied, setCopied] = useState(false);
    const [liveStatusState, setLiveStatusState] = useState<LiveStatus | null>(live_status);
    const [isPolling, setIsPolling] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);
    const [lastPolled, setLastPolled] = useState<Date | null>(null);
    const isConnected = Boolean(liveStatusState?.isConnected || whatsapp_status === 'connected');
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(!isConnected);

    // Si la cuenta está conectada o se conecta durante el escaneo, cerrar el modal de bienvenida
    useEffect(() => {
        if (isConnected) {
            setIsWelcomeModalOpen(false);
        }
    }, [isConnected]);

    // Ref para evitar stale closure dentro de setInterval
    const liveStatusRef = useRef<LiveStatus | null>(live_status);
    useEffect(() => {
        liveStatusRef.current = liveStatusState;
    }, [liveStatusState]);

    // Ref para poder cancelar el intervalo desde dentro del callback
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Formulario de configuración
    const configForm = useForm({
        whatsapp_api_url: whatsapp_api_url,
        whatsapp_instance: whatsapp_instance || `empresa_${empresa_id}`,
        whatsapp_api_key: whatsapp_api_key || '',
        whatsapp_active: whatsapp_active,
        whatsapp_rate_limit: whatsapp_rate_limit,
    });

    // Formulario de mensaje de prueba
    const [testMessage, setTestMessage] = useState({
        paisId: '',
        phoneNumber: '',
        message: __('Hello! This is a test message from the WhatsApp integration panel.'),
    });
    // Polling del estado de WhatsApp
    useEffect(() => {
        // Limpiar intervalo previo
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        const isQrActive = liveStatusState?.connectionState === 'qr_ready'
            || Boolean(liveStatusState?.qrCode)
            || liveStatusState?.connectionState === 'connecting';

        const shouldPoll = whatsapp_active
            && (!liveStatusState?.isConnected || isQrActive);

        // Más rápido cuando el QR está activo (1.5 s), más lento en otros estados (4 s)
        const pollIntervalMs = isQrActive ? 1500 : 4000;

        if (shouldPoll) {
            setIsPolling(true);

            const tick = async () => {
                try {
                    const response = await fetch('/admin/integrations/whatsapp/status', {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.success) {
                            // Leer ref ANTES del setState para evitar el valor stale
                            const wasConnected = liveStatusRef.current?.isConnected;

                            setLiveStatusState(data.status);
                            setLastPolled(new Date());

                            if (data.status?.isConnected && !wasConnected) {
                                // Detener polling de inmediato
                                if (intervalRef.current) {
                                    clearInterval(intervalRef.current);
                                    intervalRef.current = null;
                                }
                                setIsPolling(false);

                                Swal.fire({
                                    title: __('Connected!'),
                                    text: __('WhatsApp has been successfully linked.'),
                                    icon: 'success',
                                    timer: 3000,
                                    showConfirmButton: false,
                                });
                                router.reload({ only: ['whatsapp_phone', 'whatsapp_status'] });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error polling status:', error);
                }
            };

            // Primera llamada inmediata, luego el intervalo
            tick();
            intervalRef.current = setInterval(tick, pollIntervalMs);
        } else {
            setIsPolling(false);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [whatsapp_active, liveStatusState?.isConnected, liveStatusState?.connectionState]);

    /** Comprobación manual inmediata (botón "Verificar ahora") */
    const handleManualRefresh = async () => {
        setManualCheckLoading(true);
        try {
            const response = await fetch('/admin/integrations/whatsapp/status', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const wasConnected = liveStatusRef.current?.isConnected;
                    setLiveStatusState(data.status);
                    setLastPolled(new Date());

                    if (data.status?.isConnected && !wasConnected) {
                        Swal.fire({
                            title: __('Connected!'),
                            text: __('WhatsApp has been successfully linked.'),
                            icon: 'success',
                            timer: 3000,
                            showConfirmButton: false,
                        });
                        router.reload({ only: ['whatsapp_phone', 'whatsapp_status'] });
                    }
                }
            }
        } catch (e) {
            console.error('Manual refresh error:', e);
        } finally {
            setManualCheckLoading(false);
        }
    };


    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        configForm.put('/admin/integrations/whatsapp/update', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('WhatsApp configuration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                // Actualizar estado en vivo al guardar
                router.reload();
            },
        });
    };

    const handleGenerateToken = () => {
        Swal.fire({
            title: __('Are you sure?'),
            text: __('Generating a new token will invalidate the current one. You must update and sync any external client configured with it.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, generate new token'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#e11d48',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/integrations/whatsapp/generate-token', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: __('Token Generated'),
                            text: __('A new API key has been created for your company.'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    }
                });
            }
        });
    };

    const handleSyncCompany = () => {
        Swal.fire({
            title: __('Synchronize Company?'),
            text: __('This will sync the company information and token with the WhatsApp server database.'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: __('Yes, synchronize'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#059669',
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: __('Syncing...'),
                    text: __('Updating server credentials...'),
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                router.post('/admin/integrations/whatsapp/sync', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: __('Synchronized!'),
                            text: __('The company credentials have been sent to the WhatsApp API server.'),
                            icon: 'success',
                            timer: 2500,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: __('Error'),
                            text: __('Failed to sync company credentials with WhatsApp API server.'),
                            icon: 'error',
                        });
                    }
                });
            }
        });
    };

    const handleConnect = () => {
        router.post('/admin/integrations/whatsapp/connect', {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Connecting...'),
                    text: __('Initializing WhatsApp session. Please wait...'),
                    icon: 'info',
                    timer: 3000,
                    showConfirmButton: false,
                });
                // Iniciar polling
                setLiveStatusState(prev => prev ? { ...prev, connectionState: 'connecting' } : null);
            }
        });
    };

    const handleDisconnect = () => {
        Swal.fire({
            title: __('Disconnect WhatsApp?'),
            text: __('You will stop sending and receiving messages. The session on this device will be closed.'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: __('Yes, disconnect'),
            cancelButtonText: __('Cancel'),
            confirmButtonColor: '#e11d48',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/admin/integrations/whatsapp/disconnect', {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: __('Disconnected'),
                            text: __('Session closed successfully.'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                        setLiveStatusState(null);
                    }
                });
            }
        });
    };

    const handleReconnect = () => {
        router.post('/admin/integrations/whatsapp/reconnect', {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Reconnecting'),
                    text: __('Requesting session reset from Baileys server...'),
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        });
    };

    const getFullPhoneNumber = () => {
        if (!testMessage.paisId || !testMessage.phoneNumber) {
return '';
}

        const selectedPais = paises.find(p => p.id === Number(testMessage.paisId));

        if (!selectedPais?.codigo_telefonico) {
return '';
}

        const cleanCode = selectedPais.codigo_telefonico.replace(/^\+/, '');

        return `${cleanCode}${testMessage.phoneNumber.replace(/\D/g, '')}`;
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const fullNumber = getFullPhoneNumber();

        if (!fullNumber) {
            Swal.fire({
                title: __('Missing Phone'),
                text: __('Please select a country and enter a valid phone number.'),
                icon: 'error',
            });

            return;
        }

        setSendingMsg(true);
        router.post('/admin/integrations/whatsapp/send-message', {
            to: fullNumber,
            message: testMessage.message
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSendingMsg(false);
                Swal.fire({
                    title: __('Message Sent'),
                    text: __('The test message has been queued/sent successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
                setTestMessage(prev => ({ ...prev, paisId: '', phoneNumber: '', message: '' }));
            },
            onError: (errors) => {
                setSendingMsg(false);
                Swal.fire({
                    title: __('Failed to Send'),
                    text: Object.values(errors).join(', ') || __('Error occurred during sending.'),
                    icon: 'error',
                });
            }
        });
    };

    const copyToClipboard = () => {
        if (configForm.data.whatsapp_api_key) {
            navigator.clipboard.writeText(configForm.data.whatsapp_api_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('WhatsApp'), href: '/admin/integrations/whatsapp' }
    ];

    // Detallar el estado del socket en español
    const getConnectionStateText = (state: string | undefined) => {
        switch (state) {
            case 'connected':
            case 'open':
                return { text: __('Connected'), color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' };
            case 'connecting':
                return { text: __('Connecting...'), color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 animate-pulse' };
            case 'qr_ready':
                return { text: __('QR Ready (Waiting Scan)'), color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200' };
            case 'close':
            case 'disconnected':
                return { text: __('Disconnected'), color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200' };
            default:
                return { text: __('Unknown'), color: 'text-slate-500 bg-slate-50 border-slate-200' };
        }
    };

    const liveState = liveStatusState?.isConnected ? 'connected' : (liveStatusState?.connectionState || 'disconnected');
    const stateInfo = getConnectionStateText(liveState);

    // Si la API no está disponible
    const isServiceUnavailable = liveStatusState?._error === 'service_unavailable';

    return (
        <>
            <Head title={__('WhatsApp Integration')} />
            <WelcomeWhatsAppModal
                isOpen={isWelcomeModalOpen}
                onClose={() => setIsWelcomeModalOpen(false)}
                empresaNombre={empresa_nombre}
            />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-emerald-600" />
                            {__('WhatsApp API Module')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Manage your company WhatsApp session, API tokens, connection servers, and automated alerts.')}
                        </p>
                    </div>
                </div>

                {/* ─ Banner de período de prueba ─ */}
                {is_on_trial && (
                    <div className={`rounded-xl border px-5 py-4 flex flex-wrap items-start gap-4 shadow-sm ${
                        dias_restantes <= 1
                            ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800'
                            : dias_restantes <= 3
                            ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800'
                            : 'bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-800'
                    }`}>
                        <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                            dias_restantes <= 1
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50'
                                : dias_restantes <= 3
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'
                                : 'bg-sky-100 text-sky-600 dark:bg-sky-950/50'
                        }`}>
                            <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-semibold text-sm ${
                                    dias_restantes <= 1 ? 'text-rose-800 dark:text-rose-300'
                                    : dias_restantes <= 3 ? 'text-amber-800 dark:text-amber-300'
                                    : 'text-sky-800 dark:text-sky-300'
                                }`}>
                                    {__('Free Trial Period')}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                    dias_restantes <= 1
                                        ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300'
                                        : dias_restantes <= 3
                                        ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                                        : 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300'
                                }`}>
                                    {dias_restantes === 0
                                        ? __('Trial ends today')
                                        : dias_restantes === 1
                                        ? `1 ${__('day')}`
                                        : `${dias_restantes} ${__('days')}`
                                    }
                                </span>
                            </div>
                            <p className={`text-xs mt-1 ${
                                dias_restantes <= 1 ? 'text-rose-700/80 dark:text-rose-400'
                                : dias_restantes <= 3 ? 'text-amber-700/80 dark:text-amber-400'
                                : 'text-sky-700/80 dark:text-sky-400'
                            }`}>
                                {dias_restantes > 0
                                    ? `${__('Your free trial period ends in')} ${dias_restantes} ${dias_restantes === 1 ? __('day') : __('days')}. `
                                    : `${__('Trial ends today')}. `
                                }
                                {__('WhatsApp module active during trial')} — {__('Access expires when trial ends')}.
                            </p>
                            {trial_ends_at && (
                                <p className="text-xs mt-0.5 opacity-60">
                                    {new Date(trial_ends_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                )}


                {isServiceUnavailable && (
                    <Card className="border-rose-300 bg-rose-50/50 dark:bg-rose-950/10">
                        <CardContent className="flex items-start gap-3 p-4">
                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-rose-800 dark:text-rose-400">{__('WhatsApp Server Offline')}</h3>
                                <p className="text-sm text-rose-700 dark:text-rose-500/90 mt-1">
                                    {__('The WhatsApp API service at')} <code className="font-mono text-xs">{whatsapp_api_url}</code> {__('is currently unreachable. Please make sure the node service is running.')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ─────────────────────────────────────────────────────────
                     PANEL DE ADMINISTRADOR DE EMPRESA (no superadmin)
                ───────────────────────────────────────────────────────── */}
                {!is_superadmin && (
                    <div className="space-y-6">
                        {/* Banner de estado */}
                        <div className="rounded-xl border bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/10 p-4 flex flex-wrap items-center gap-4 justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${
                                        liveStatusState?.isConnected
                                            ? 'bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.45)] animate-pulse'
                                            : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                />
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{empresa_nombre}</span>
                                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${stateInfo.color}`}>
                                    {stateInfo.text}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 dark:text-slate-400">
                                {liveStatusState?.user?.id && (
                                    <div className="flex items-center gap-1.5">
                                        <Smartphone className="h-4 w-4 text-emerald-500" />
                                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                            +{liveStatusState.user.id.split('@')[0]}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    <span>{whatsapp_rate_limit} msg/min</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {whatsapp_active ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{__('Active')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <span className="text-amber-700 dark:text-amber-400 font-medium">{__('Inactive')}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Grid principal del admin */}
                        <div className="grid gap-6 md:grid-cols-12">
                            {/* Tarjeta info de empresa (solo lectura) */}
                            <div className="md:col-span-4">
                                <Card className="shadow-sm border-t-4 border-t-emerald-600 h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Info className="h-5 w-5 text-slate-500" />
                                            {__('Integration Info')}
                                        </CardTitle>
                                        <CardDescription>
                                            {__('Current WhatsApp configuration for')} <span className="font-semibold text-slate-700 dark:text-slate-200">{empresa_nombre}</span>.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {/* Estado activo */}
                                        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <MessageSquare className="h-4 w-4" />
                                                <span>{__('Integration')}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                whatsapp_active
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {whatsapp_active ? __('Enabled') : __('Disabled')}
                                            </span>
                                        </div>

                                        {/* Rate limit */}
                                        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Zap className="h-4 w-4" />
                                                <span>{__('Rate Limit')}</span>
                                            </div>
                                            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                {whatsapp_rate_limit} msg/min
                                            </span>
                                        </div>

                                        {/* Instancia */}
                                        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Shield className="h-4 w-4" />
                                                <span>{__('Instance')}</span>
                                            </div>
                                            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                                {whatsapp_instance || `empresa_${empresa_id}`}
                                            </span>
                                        </div>

                                        {/* Teléfono vinculado */}
                                        {liveStatusState?.user?.id && (
                                            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{__('Linked Phone')}</span>
                                                </div>
                                                <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                                                    +{liveStatusState.user.id.split('@')[0]}
                                                </span>
                                            </div>
                                        )}

                                        {/* Última sincronización */}
                                        {liveStatusState?.lastSeen && (
                                            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{__('Last Sync')}</span>
                                                </div>
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {new Date(liveStatusState.lastSeen).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tarjeta de gestión de sesión */}
                            <div className="md:col-span-8">
                                <Card className="shadow-sm border-t-4 border-t-emerald-600 h-full">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Activity className="h-5 w-5 text-slate-500" />
                                                    {__('Connection Status')}
                                                </CardTitle>
                                                <CardDescription>{__('Manage your WhatsApp session for this company.')}</CardDescription>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${stateInfo.color}`}>
                                                {stateInfo.text}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                                        {!whatsapp_active ? (
                                            <div className="space-y-3">
                                                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <AlertTriangle className="h-6 w-6" />
                                                </div>
                                                <h3 className="font-semibold text-slate-700 dark:text-slate-300">{__('Integration Inactive')}</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm">
                                                    {__('Contact your system administrator to enable this integration.')}
                                                </p>
                                            </div>
                                        ) : isServiceUnavailable ? (
                                            <div className="space-y-3">
                                                <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
                                                    <WifiOff className="h-6 w-6" />
                                                </div>
                                                <h3 className="font-semibold text-rose-700 dark:text-rose-400">{__('Server Offline')}</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm">
                                                    {__('Unable to reach the WhatsApp engine. Please contact your system administrator.')}
                                                </p>
                                            </div>
                                        ) : liveStatusState?.isConnected ? (
                                            /* CONECTADO */
                                            <div className="space-y-5 w-full py-2">
                                                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100/60 dark:shadow-none">
                                                    <CheckCircle2 className="h-9 w-9" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{__('Successfully Linked')}</h3>
                                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {__('Active session — messages are being processed')}
                                                    </p>
                                                </div>
                                                <div className="max-w-xs mx-auto flex flex-col gap-2 py-3 px-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm">
                                                    {liveStatusState.user?.name && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">{__('Name')}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{liveStatusState.user.name}</span>
                                                        </div>
                                                    )}
                                                    {liveStatusState.user?.id && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">{__('Phone')}</span>
                                                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">+{liveStatusState.user.id.split('@')[0]}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex justify-center gap-3 pt-1">
                                                    <Button variant="outline" className="gap-2" onClick={handleReconnect}>
                                                        <RefreshCw className="h-4 w-4" />
                                                        {__('Reset Session')}
                                                    </Button>
                                                    <Button variant="destructive" className="gap-2" onClick={handleDisconnect}>
                                                        <Power className="h-4 w-4" />
                                                        {__('Disconnect')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (liveStatusState?.connectionState === 'qr_ready' || Boolean(liveStatusState?.qrCode)) && liveStatusState?.qrCode ? (
                                            /* QR CODE */
                                            <div className="space-y-4 py-2">
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{__('Scan QR Code to Link Account')}</h3>
                                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                                    {__('Open WhatsApp on your phone, go to Menu or Settings > Linked Devices > Link a Device, and point your camera to this screen.')}
                                                </p>
                                                <div className="relative mx-auto w-60 h-60 border-4 border-slate-100 rounded-xl p-3 bg-white shadow-md flex items-center justify-center">
                                                    <img
                                                        src={liveStatusState.qrCode}
                                                        alt="WhatsApp QR Code"
                                                        className="w-full h-full object-contain select-none"
                                                    />
                                                    {isPolling && (
                                                        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-pulse" title={__('Checking scan status...')}>
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center gap-3">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                                        <span>{__('Waiting for phone scan...')}</span>
                                                        {lastPolled && (
                                                            <span className="opacity-60">
                                                                · {__('Checked')} {Math.round((Date.now() - lastPolled.getTime()) / 1000)}s {__('ago')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1.5 h-7 text-xs"
                                                        onClick={handleManualRefresh}
                                                        disabled={manualCheckLoading}
                                                    >
                                                        <RefreshCw className={`h-3 w-3 ${manualCheckLoading ? 'animate-spin' : ''}`} />
                                                        {__('Check Now')}
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" onClick={handleDisconnect} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs">
                                                    {__('Cancel and Clean Session')}
                                                </Button>
                                            </div>
                                        ) : (
                                            /* DESCONECTADO */
                                            <div className="space-y-4">
                                                <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow">
                                                    <WifiOff className="h-7 w-7" />
                                                </div>
                                                <h3 className="font-semibold text-slate-700 dark:text-slate-300">{__('No Active Session')}</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm">
                                                    {__('Click the button below to start a new WhatsApp session and get the QR code to link your account.')}
                                                </p>
                                                <Button
                                                    onClick={handleConnect}
                                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6"
                                                >
                                                    <Wifi className="h-4 w-4" />
                                                    {__('Connect WhatsApp')}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left Column: Config Panel — solo visible para superadmins */}
                    {is_superadmin && (
                        <div className="md:col-span-5 space-y-6">
                            <Card className="shadow-sm border-t-4 border-t-emerald-600">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Settings2 className="h-5 w-5 text-slate-500" />
                                        {__('API Configuration')}
                                    </CardTitle>
                                    <CardDescription>
                                        {__('Set connection details for')} <span className="font-semibold text-slate-700 dark:text-slate-200">{empresa_nombre}</span>.
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSaveConfig}>
                                    <CardContent className="space-y-5">
                                        {/* Enable Switch */}
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">{__('Enable WhatsApp Integration')}</Label>
                                                <p className="text-xs text-muted-foreground">{__('Enable automated template sending.')}</p>
                                            </div>
                                            <Switch
                                                checked={configForm.data.whatsapp_active}
                                                onCheckedChange={(checked) => configForm.setData('whatsapp_active', checked)}
                                            />
                                        </div>

                                        {/* Connection IP / API URL */}
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_api_url">{__('Connection IP / API URL')}</Label>
                                            <Input
                                                id="whatsapp_api_url"
                                                placeholder="http://localhost:8092"
                                                value={configForm.data.whatsapp_api_url}
                                                onChange={(e) => configForm.setData('whatsapp_api_url', e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {__('Node service base URL.')}
                                            </p>
                                        </div>

                                        {/* WhatsApp Instance Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_instance">{__('WhatsApp Instance Name')}</Label>
                                            <Input
                                                id="whatsapp_instance"
                                                placeholder="empresa_1"
                                                value={configForm.data.whatsapp_instance}
                                                onChange={(e) => configForm.setData('whatsapp_instance', e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {__('Name of the session/instance in the WhatsApp API engine (e.g. ventas, empresa_1).')}
                                            </p>
                                        </div>

                                        {/* Rate Limit */}
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_rate_limit">{__('Rate Limit (msg/min)')}</Label>
                                            <Input
                                                id="whatsapp_rate_limit"
                                                type="number"
                                                min="1"
                                                max="1000"
                                                value={configForm.data.whatsapp_rate_limit}
                                                onChange={(e) => configForm.setData('whatsapp_rate_limit', parseInt(e.target.value) || 60)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {__('Maximum messages sent per minute for this company.')}
                                            </p>
                                        </div>

                                        {/* Company Token */}
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_api_key">{__('Company API Token')}</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="whatsapp_api_key"
                                                    type="text"
                                                    placeholder={__('Paste or enter API token...')}
                                                    value={configForm.data.whatsapp_api_key}
                                                    onChange={(e) => configForm.setData('whatsapp_api_key', e.target.value)}
                                                    className="font-mono text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={copyToClipboard}
                                                    disabled={!configForm.data.whatsapp_api_key}
                                                    className="shrink-0"
                                                    title={__('Copy to clipboard')}
                                                >
                                                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {__('This credentials token authorizes this company to communicate with the node server. You can copy or paste it directly.')}
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col gap-3">
                                        {/* Save Button */}
                                        <Button type="submit" disabled={configForm.processing} className="w-full gap-2">
                                            <RefreshCw className={`h-4 w-4 ${configForm.processing ? 'animate-spin' : ''}`} />
                                            {__('Save Settings')}
                                        </Button>

                                        {/* Button Group */}
                                        <div className="grid grid-cols-2 gap-2 w-full mt-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleGenerateToken}
                                                className="gap-1 text-slate-700 hover:text-slate-900 border-slate-200 text-xs"
                                            >
                                                <Key className="h-3.5 w-3.5" />
                                                {__('Generate Token')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleSyncCompany}
                                                disabled={!whatsapp_api_key}
                                                className="gap-1 text-slate-700 hover:text-emerald-700 border-slate-200 text-xs"
                                            >
                                                <Database className="h-3.5 w-3.5" />
                                                {__('Sync Company')}
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* Right Column: Connection / QR Scanner Card — solo visible para superadmins */}
                    {is_superadmin && (
                    <div className="md:col-span-7 space-y-6">
                        {/* Status / QR Card */}
                        <Card className="shadow-sm border-t-4 border-t-emerald-600">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-slate-500" />
                                            {__('Connection Status')}
                                        </CardTitle>
                                        <CardDescription>{__('Link and monitor WhatsApp server state.')}</CardDescription>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${stateInfo.color}`}>
                                        {stateInfo.text}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                                {!whatsapp_active ? (
                                    <div className="space-y-3">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{__('Integration Inactive')}</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            {__('You must check the "Enable WhatsApp Integration" switch and save configurations to start.')}
                                        </p>
                                    </div>
                                ) : isServiceUnavailable ? (
                                    <div className="space-y-3">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-rose-700 dark:text-rose-400">{__('Server Offline')}</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            {__('Unable to reach the WhatsApp engine. Please check system processes.')}
                                        </p>
                                    </div>
                                ) : liveStatusState?.isConnected ? (
                                    /* CONNECTED VIEW */
                                    <div className="space-y-6 w-full py-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/40">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{__('Successfully Linked')}</h3>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                                {__('Active Session on Baileys Engine')}
                                            </p>
                                        </div>

                                        <div className="max-w-md mx-auto grid grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 text-left text-sm">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground block">{__('Linked Account')}</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                                                    {liveStatusState.user?.name || __('WhatsApp Account')}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground block">{__('Phone JID')}</span>
                                                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    {liveStatusState.user?.id.split('@')[0]}
                                                </span>
                                            </div>
                                            <div className="space-y-1 col-span-2 border-t pt-2 mt-1">
                                                <span className="text-xs text-muted-foreground block">{__('Last Sync / Connection')}</span>
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {liveStatusState.lastSeen ? new Date(liveStatusState.lastSeen).toLocaleString() : __('N/A')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center gap-3 pt-2">
                                            <Button variant="outline" className="gap-2" onClick={handleReconnect}>
                                                <RefreshCw className="h-4 w-4" />
                                                {__('Reset Session')}
                                            </Button>
                                            <Button variant="destructive" className="gap-2" onClick={handleDisconnect}>
                                                <Power className="h-4 w-4" />
                                                {__('Disconnect')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (liveStatusState?.connectionState === 'qr_ready' || liveStatusState?.status === 'qr' || Boolean(liveStatusState?.qrCode)) && liveStatusState?.qrCode ? (
                                    /* QR CODE VIEW */
                                    <div className="space-y-5 py-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                                            {__('Scan QR Code to Link Account')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                            {__('Open WhatsApp on your phone, go to Menu or Settings > Linked Devices > Link a Device, and point your camera to this screen.')}
                                        </p>

                                        {/* QR container */}
                                        <div className="relative mx-auto w-64 h-64 border-4 border-slate-100 rounded-lg p-4 bg-white shadow-sm flex items-center justify-center">
                                            <img
                                                src={liveStatusState.qrCode}
                                                alt="WhatsApp QR Code"
                                                className="w-full h-full object-contain select-none"
                                            />
                                            {isPolling && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-pulse" title={__('Checking scan status...')}>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center gap-3">
                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                                <span>{__('Waiting for phone scan...')}</span>
                                                {lastPolled && (
                                                    <span className="opacity-60">
                                                        · {__('Checked')} {Math.round((Date.now() - lastPolled.getTime()) / 1000)}s {__('ago')}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 h-7 text-xs"
                                                onClick={handleManualRefresh}
                                                disabled={manualCheckLoading}
                                            >
                                                <RefreshCw className={`h-3 w-3 ${manualCheckLoading ? 'animate-spin' : ''}`} />
                                                {__('Check Now')}
                                            </Button>
                                        </div>

                                        <Button variant="ghost" onClick={handleDisconnect} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs">
                                            {__('Cancel and Clean Session')}
                                        </Button>
                                    </div>
                                ) : (
                                    /* DISCONNECTED VIEW */
                                    <div className="space-y-4">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-slate-800">
                                            <QrCode className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">{__('Engine Disconnected')}</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            {__('There is no active session. Click Connect to initiate a new session and generate a linking QR code.')}
                                        </p>
                                        <Button
                                            onClick={handleConnect}
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                        >
                                            <Power className="h-4 w-4" />
                                            {__('Initiate Connection')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                    )}
                </div>

                {/* Test Messaging Panel - Full Width */}
                {liveStatusState?.isConnected && (
                    <Card className="shadow-sm border-t-4 border-t-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Send className="h-4 w-4 text-slate-500" />
                                {__('Send Test Message')}
                            </CardTitle>
                            <CardDescription>
                                {__('Verify integration output by sending a real-time message to any phone.')}
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSendMessage}>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-12 gap-4">
                                    <div className="md:col-span-12 space-y-2">
                                        <Label>{__('Recipient Phone Number')}</Label>
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={testMessage.paisId}
                                            phoneValue={testMessage.phoneNumber}
                                            onPaisChange={(paisId) => setTestMessage(prev => ({ ...prev, paisId: String(paisId) }))}
                                            onPhoneChange={(phone) => setTestMessage(prev => ({ ...prev, phoneNumber: phone }))}
                                            placeholder={__('4121234567')}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {__('Select country and enter only the phone number.')}
                                        </p>
                                    </div>
                                    <div className="md:col-span-12 space-y-2">
                                        <Label htmlFor="test_msg">{__('Message Text')}</Label>
                                        <textarea
                                            id="test_msg"
                                            rows={4}
                                            value={testMessage.message}
                                            onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
                                            className="w-full flex min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                                <Button type="submit" disabled={sendingMsg} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Send className={`h-4 w-4 ${sendingMsg ? 'animate-pulse' : ''}`} />
                                    {__('Send Message')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </div>
        </>
    );
}