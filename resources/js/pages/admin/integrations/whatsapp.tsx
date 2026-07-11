import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Settings2, MessageSquare, QrCode, RefreshCw, Power, Send, Key,
    Database, AlertTriangle, CheckCircle2, Copy, Check, Activity, Phone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import Swal from 'sweetalert2';
import PhoneInputGroup, { PaisPhoneOption } from '@/pages/admin/Empresas/Partials/PhoneInputGroup';

interface LiveStatus {
    isConnected: boolean;
    connectionState: string;
    qrCode: string | null;
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
    whatsapp_rate_limit: number;
    whatsapp_active: boolean;
    whatsapp_phone: string | null;
    whatsapp_status: string | null;
    live_status: LiveStatus | null;
    paises: PaisPhoneOption[];
}

export default function WhatsAppIntegration({
    empresa_id,
    empresa_nombre,
    whatsapp_api_key,
    whatsapp_api_url,
    whatsapp_rate_limit,
    whatsapp_active,
    whatsapp_phone,
    whatsapp_status,
    live_status,
    paises
}: PageProps) {
    const { __ } = useTranslate();
    const [copied, setCopied] = useState(false);
    const [liveStatusState, setLiveStatusState] = useState<LiveStatus | null>(live_status);
    const [isPolling, setIsPolling] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);

    // Formulario de configuración
    const configForm = useForm({
        whatsapp_api_url: whatsapp_api_url,
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
        let intervalId: NodeJS.Timeout;

        // Solo hacemos polling si la integración está activa y no está completamente conectada con éxito
        const shouldPoll = whatsapp_active && (!liveStatusState?.isConnected || liveStatusState?.connectionState === 'connecting' || liveStatusState?.connectionState === 'qr_ready');

        if (shouldPoll) {
            setIsPolling(true);
            intervalId = setInterval(async () => {
                try {
                    const response = await fetch('/admin/integrations/whatsapp/status');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            setLiveStatusState(data.status);

                            // Si se conectó exitosamente durante el polling, recargar la página para actualizar props
                            if (data.status?.isConnected && !liveStatusState?.isConnected) {
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
            }, 3000);
        } else {
            setIsPolling(false);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [whatsapp_active, liveStatusState?.isConnected, liveStatusState?.connectionState]);

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
        if (!testMessage.paisId || !testMessage.phoneNumber) return '';
        const selectedPais = paises.find(p => p.id === Number(testMessage.paisId));
        if (!selectedPais?.codigo_telefonico) return '';
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
        if (whatsapp_api_key) {
            navigator.clipboard.writeText(whatsapp_api_key);
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

                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left Column: Config Panel (recursos/whatsapp) */}
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
                                            placeholder="http://localhost:3001"
                                            value={configForm.data.whatsapp_api_url}
                                            onChange={(e) => configForm.setData('whatsapp_api_url', e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {__('Node service base URL (Baileys server).')}
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
                                        <Label>{__('Company API Token')}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                readOnly
                                                type="text"
                                                value={whatsapp_api_key || __('No token generated')}
                                                className="font-mono text-sm bg-slate-50 dark:bg-slate-900 text-slate-600 select-all"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={copyToClipboard}
                                                disabled={!whatsapp_api_key}
                                                className="shrink-0"
                                                title={__('Copy to clipboard')}
                                            >
                                                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {__('This credentials token authorizes this company to communicate with the node server.')}
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

                    {/* Right Column: Connection / QR Scanner Card */}
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
                                ) : liveStatusState?.connectionState === 'qr_ready' && liveStatusState.qrCode ? (
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

                                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                            <span>{__('Waiting for phone scan...')}</span>
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
                                            disabled={!whatsapp_api_key}
                                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                        >
                                            <Power className="h-4 w-4" />
                                            {__('Initiate Connection')}
                                        </Button>
                                        {!whatsapp_api_key && (
                                            <p className="text-xs text-rose-600 font-medium">
                                                {__('You must generate a Token and Sync Company before connecting.')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
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