import { Head, useForm, Link } from '@inertiajs/react';
import { Settings2, Map, ShieldCheck, Save, MessageSquare, CreditCard, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';

interface PageProps {
    is_super_admin?: boolean;
    mapbox_api_key: string | null;
    mapbox_active: boolean;
    google_maps_api_key: string | null;
    google_maps_active: boolean;
    whatsapp_active: boolean;
    whatsapp_connected: boolean;
    paypal_active?: boolean;
    paypal_mode?: string;
    paypal_client_id?: string;
    paypal_client_secret?: string;
    mercadopago_active?: boolean;
    mercadopago_mode?: string;
    mercadopago_public_key?: string;
    mercadopago_access_token?: string;
    stripe_active?: boolean;
    stripe_mode?: string;
    stripe_publishable_key?: string;
    stripe_secret_key?: string;
    stripe_webhook_secret?: string;
}

export default function Integrations({ 
    is_super_admin = false,
    mapbox_api_key, 
    mapbox_active, 
    google_maps_api_key,
    google_maps_active,
    whatsapp_active, 
    whatsapp_connected,
    paypal_active = false,
    paypal_mode = 'sandbox',
    paypal_client_id = '',
    paypal_client_secret = '',
    mercadopago_active = false,
    mercadopago_mode = 'sandbox',
    mercadopago_public_key = '',
    mercadopago_access_token = '',
    stripe_active = false,
    stripe_mode = 'test',
    stripe_publishable_key = '',
    stripe_secret_key = '',
    stripe_webhook_secret = ''
}: PageProps) {
    const { __ } = useTranslate();

    const mapboxForm = useForm({
        mapbox_api_key: mapbox_api_key || '',
        mapbox_active: mapbox_active,
    });

    const googleMapsForm = useForm({
        google_maps_api_key: google_maps_api_key || '',
        google_maps_active: google_maps_active,
    });

    const paypalForm = useForm({
        paypal_active: paypal_active,
        paypal_mode: paypal_mode,
        paypal_client_id: paypal_client_id,
        paypal_client_secret: paypal_client_secret,
    });

    const mercadopagoForm = useForm({
        mercadopago_active: mercadopago_active,
        mercadopago_mode: mercadopago_mode,
        mercadopago_public_key: mercadopago_public_key,
        mercadopago_access_token: mercadopago_access_token,
    });

    const stripeForm = useForm({
        stripe_active: stripe_active,
        stripe_mode: stripe_mode,
        stripe_publishable_key: stripe_publishable_key,
        stripe_secret_key: stripe_secret_key,
        stripe_webhook_secret: stripe_webhook_secret,
    });

    const handleSaveMapbox = (e: React.FormEvent) => {
        e.preventDefault();
        mapboxForm.put('/admin/integrations/mapbox', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('Mapbox integration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleSaveGoogleMaps = (e: React.FormEvent) => {
        e.preventDefault();
        googleMapsForm.put('/admin/integrations/google-maps', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('Google Maps integration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleSavePaypal = (e: React.FormEvent) => {
        e.preventDefault();
        paypalForm.put('/admin/integrations/paypal', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('PayPal integration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleSaveMercadoPago = (e: React.FormEvent) => {
        e.preventDefault();
        mercadopagoForm.put('/admin/integrations/mercadopago', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('Mercado Pago integration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleSaveStripe = (e: React.FormEvent) => {
        e.preventDefault();
        stripeForm.put('/admin/integrations/stripe', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('Stripe integration has been successfully updated.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' }
    ];

    return (
        <>
            <Head title={__('Integrations')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Settings2 className="h-8 w-8 text-indigo-600" />
                            {__('Integrations Catalog')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Configure external APIs, mapping systems, and third-party services for your business.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Mapbox Integration */}
                    <Card className="shadow-sm border-t-4 border-t-indigo-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
                                        <Map className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('Mapbox Maps')}</CardTitle>
                                        <CardDescription>{__('Interactive geolocation and high-performance vector maps.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={mapboxForm.data.mapbox_active} />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveMapbox}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable Mapbox')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle map engine replacement from Leaflet to Mapbox.')}</p>
                                    </div>
                                    <Switch
                                        checked={mapboxForm.data.mapbox_active}
                                        onCheckedChange={(checked) => mapboxForm.setData('mapbox_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mapbox_api_key">{__('Mapbox Access Token')}</Label>
                                    <Input
                                        id="mapbox_api_key"
                                        type="password"
                                        placeholder="pk.eyJ1..."
                                        value={mapboxForm.data.mapbox_api_key}
                                        onChange={(e) => mapboxForm.setData('mapbox_api_key', e.target.value)}
                                        disabled={!mapboxForm.data.mapbox_active}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{__('Get your token from')}</span>
                                        <a
                                            href="https://mapbox.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-indigo-600 hover:underline flex items-center gap-0.5"
                                        >
                                            mapbox.com <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-between">
                                <Link href="/admin/integrations/map">
                                    <Button variant="outline" size="sm" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-950/20" disabled={!mapboxForm.data.mapbox_active}>
                                        <Map className="h-4 w-4" />
                                        {__('View Routes')}
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={mapboxForm.processing || !mapboxForm.data.mapbox_active} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {__('Save Changes')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Google Maps Integration */}
                    <Card className="shadow-sm border-t-4 border-t-blue-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600">
                                        <Map className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('Google Maps API')}</CardTitle>
                                        <CardDescription>{__('High-accuracy geocoding, places autocomplete, and directions service.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={googleMapsForm.data.google_maps_active} />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveGoogleMaps}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable Google Maps')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Enable Google Maps JS API and Places Autocomplete.')}</p>
                                    </div>
                                    <Switch
                                        checked={googleMapsForm.data.google_maps_active}
                                        onCheckedChange={(checked) => googleMapsForm.setData('google_maps_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="google_maps_api_key">{__('Google Maps API Key')}</Label>
                                    <Input
                                        id="google_maps_api_key"
                                        type="password"
                                        placeholder="AIzaSy..."
                                        value={googleMapsForm.data.google_maps_api_key}
                                        onChange={(e) => googleMapsForm.setData('google_maps_api_key', e.target.value)}
                                        disabled={!googleMapsForm.data.google_maps_active}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{__('Get your API key from')}</span>
                                        <a
                                            href="https://console.cloud.google.com"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline flex items-center gap-0.5"
                                        >
                                            console.cloud.google.com <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                                <Button type="submit" disabled={googleMapsForm.processing || !googleMapsForm.data.google_maps_active} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {__('Save Changes')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* WhatsApp API Integration */}
                    <Card className="shadow-sm border-t-4 border-t-emerald-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('WhatsApp Business API')}</CardTitle>
                                        <CardDescription>{__('Automate customer messaging and trigger notification alerts.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeWhatsAppStatus active={whatsapp_active} connected={whatsapp_connected} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 py-4 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                {__('Connect your corporate WhatsApp account using QR code. Send transactional alerts, customer reminders, and manage templates.')}
                            </p>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                            <Link href="/admin/integrations/whatsapp">
                                <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/20">
                                    <Settings2 className="h-4 w-4" />
                                    {__('Configure')}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>

                {/* Pasarelas de Pago Globales SaaS (Exclusivo SuperAdmin / Empresa 1) */}
                {is_super_admin && (
                    <div className="space-y-4 pt-6 border-t">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <CreditCard className="h-6 w-6 text-sky-600" />
                                {__('Pasarelas de Pago SaaS (Cobro de Suscripciones)')}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {__('Configuración global de pasarelas de pago online para recibir los cobros por renovación de licencias de la plataforma.')}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* PayPal Integration */}
                            <Card className="shadow-sm border-t-4 border-t-sky-500 flex flex-col justify-between">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded bg-sky-50 dark:bg-sky-950/20 text-sky-600 font-bold text-xs">
                                                PP
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{__('PayPal')}</CardTitle>
                                                <CardDescription className="text-xs">{__('Pagos internacionales')}</CardDescription>
                                            </div>
                                        </div>
                                        <BadgeStatus active={paypalForm.data.paypal_active} />
                                    </div>
                                </CardHeader>
                                <form onSubmit={handleSavePaypal}>
                                    <CardContent className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <Label className="text-xs font-medium">{__('Habilitar PayPal')}</Label>
                                            <Switch
                                                checked={paypalForm.data.paypal_active}
                                                onCheckedChange={(checked) => paypalForm.setData('paypal_active', checked)}
                                            />
                                        </div>

                                         <div className="space-y-1">
                                             <Label className="text-xs">{__('Modo de Entorno')}</Label>
                                             <Select
                                                 value={paypalForm.data.paypal_mode}
                                                 onValueChange={(val) => paypalForm.setData('paypal_mode', val)}
                                                 disabled={!paypalForm.data.paypal_active}
                                             >
                                                 <SelectTrigger size="sm" className="h-8 text-xs">
                                                     <SelectValue placeholder={__('Seleccionar entorno')} />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                     <SelectItem value="sandbox">{__('Sandbox (Pruebas)')}</SelectItem>
                                                     <SelectItem value="live">{__('Live (Producción)')}</SelectItem>
                                                 </SelectContent>
                                             </Select>
                                         </div>

                                         <div className="space-y-1">
                                             <Label htmlFor="paypal_client_id" className="text-xs">{__('Client ID')}</Label>
                                             <Input
                                                 id="paypal_client_id"
                                                 type="text"
                                                 placeholder="A..."
                                                 value={paypalForm.data.paypal_client_id}
                                                 onChange={(e) => paypalForm.setData('paypal_client_id', e.target.value)}
                                                 disabled={!paypalForm.data.paypal_active}
                                                 className="font-mono text-xs h-8"
                                             />
                                         </div>

                                         <div className="space-y-1">
                                             <Label htmlFor="paypal_client_secret" className="text-xs">{__('Client Secret')}</Label>
                                             <Input
                                                 id="paypal_client_secret"
                                                 type="password"
                                                 placeholder="E..."
                                                 value={paypalForm.data.paypal_client_secret}
                                                 onChange={(e) => paypalForm.setData('paypal_client_secret', e.target.value)}
                                                 disabled={!paypalForm.data.paypal_active}
                                                 className="font-mono text-xs h-8"
                                             />
                                         </div>
                                     </CardContent>
                                     <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-4 py-3 flex justify-end">
                                         <Button type="submit" size="sm" disabled={paypalForm.processing || !paypalForm.data.paypal_active} className="gap-2 text-xs h-8">
                                             <Save className="h-3.5 w-3.5" />
                                             {__('Guardar PayPal')}
                                         </Button>
                                     </CardFooter>
                                 </form>
                             </Card>

                             {/* Mercado Pago Integration */}
                             <Card className="shadow-sm border-t-4 border-t-cyan-500 flex flex-col justify-between">
                                 <CardHeader>
                                     <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-2">
                                             <div className="p-2 rounded bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 font-bold text-xs">
                                                 MP
                                             </div>
                                             <div>
                                                 <CardTitle className="text-base">{__('Mercado Pago')}</CardTitle>
                                                 <CardDescription className="text-xs">{__('Cobros en Latinoamérica')}</CardDescription>
                                             </div>
                                         </div>
                                         <BadgeStatus active={mercadopagoForm.data.mercadopago_active} />
                                     </div>
                                 </CardHeader>
                                 <form onSubmit={handleSaveMercadoPago}>
                                     <CardContent className="space-y-3 text-xs">
                                         <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                             <Label className="text-xs font-medium">{__('Habilitar Mercado Pago')}</Label>
                                             <Switch
                                                 checked={mercadopagoForm.data.mercadopago_active}
                                                 onCheckedChange={(checked) => mercadopagoForm.setData('mercadopago_active', checked)}
                                             />
                                         </div>

                                         <div className="space-y-1">
                                             <Label className="text-xs">{__('Modo de Entorno')}</Label>
                                             <Select
                                                 value={mercadopagoForm.data.mercadopago_mode}
                                                 onValueChange={(val) => mercadopagoForm.setData('mercadopago_mode', val)}
                                                 disabled={!mercadopagoForm.data.mercadopago_active}
                                             >
                                                 <SelectTrigger size="sm" className="h-8 text-xs">
                                                     <SelectValue placeholder={__('Seleccionar entorno')} />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                     <SelectItem value="sandbox">{__('Sandbox (Pruebas)')}</SelectItem>
                                                     <SelectItem value="live">{__('Live (Producción)')}</SelectItem>
                                                 </SelectContent>
                                             </Select>
                                         </div>

                                         <div className="space-y-1">
                                             <Label htmlFor="mercadopago_public_key" className="text-xs">{__('Public Key')}</Label>
                                             <Input
                                                 id="mercadopago_public_key"
                                                 type="text"
                                                 placeholder="APP_USR-..."
                                                 value={mercadopagoForm.data.mercadopago_public_key}
                                                 onChange={(e) => mercadopagoForm.setData('mercadopago_public_key', e.target.value)}
                                                 disabled={!mercadopagoForm.data.mercadopago_active}
                                                 className="font-mono text-xs h-8"
                                             />
                                         </div>

                                         <div className="space-y-1">
                                             <Label htmlFor="mercadopago_access_token" className="text-xs">{__('Access Token')}</Label>
                                             <Input
                                                 id="mercadopago_access_token"
                                                 type="password"
                                                 placeholder="APP_USR-..."
                                                 value={mercadopagoForm.data.mercadopago_access_token}
                                                 onChange={(e) => mercadopagoForm.setData('mercadopago_access_token', e.target.value)}
                                                 disabled={!mercadopagoForm.data.mercadopago_active}
                                                 className="font-mono text-xs h-8"
                                             />
                                         </div>
                                     </CardContent>
                                     <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-4 py-3 flex justify-end">
                                         <Button type="submit" size="sm" disabled={mercadopagoForm.processing || !mercadopagoForm.data.mercadopago_active} className="gap-2 text-xs h-8 bg-cyan-600 hover:bg-cyan-700">
                                             <Save className="h-3.5 w-3.5" />
                                             {__('Guardar Mercado Pago')}
                                         </Button>
                                     </CardFooter>
                                 </form>
                             </Card>

                             {/* Stripe Integration */}
                             <Card className="shadow-sm border-t-4 border-t-indigo-500 flex flex-col justify-between">
                                 <CardHeader>
                                     <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-2">
                                             <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold text-xs">
                                                 ST
                                             </div>
                                             <div>
                                                 <CardTitle className="text-base">{__('Stripe')}</CardTitle>
                                                 <CardDescription className="text-xs">{__('Tarjetas globales')}</CardDescription>
                                             </div>
                                         </div>
                                         <BadgeStatus active={stripeForm.data.stripe_active} />
                                     </div>
                                 </CardHeader>
                                 <form onSubmit={handleSaveStripe}>
                                     <CardContent className="space-y-3 text-xs">
                                         <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                             <Label className="text-xs font-medium">{__('Habilitar Stripe')}</Label>
                                             <Switch
                                                 checked={stripeForm.data.stripe_active}
                                                 onCheckedChange={(checked) => stripeForm.setData('stripe_active', checked)}
                                             />
                                         </div>

                                         <div className="space-y-1">
                                             <Label className="text-xs">{__('Modo de Entorno')}</Label>
                                             <Select
                                                 value={stripeForm.data.stripe_mode}
                                                 onValueChange={(val) => stripeForm.setData('stripe_mode', val)}
                                                 disabled={!stripeForm.data.stripe_active}
                                             >
                                                 <SelectTrigger size="sm" className="h-8 text-xs">
                                                     <SelectValue placeholder={__('Seleccionar entorno')} />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                     <SelectItem value="test">{__('Test (Pruebas)')}</SelectItem>
                                                     <SelectItem value="live">{__('Live (Producción)')}</SelectItem>
                                                 </SelectContent>
                                             </Select>
                                         </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="stripe_publishable_key" className="text-xs">{__('Publishable Key')}</Label>
                                            <Input
                                                id="stripe_publishable_key"
                                                type="text"
                                                placeholder="pk_test_..."
                                                value={stripeForm.data.stripe_publishable_key}
                                                onChange={(e) => stripeForm.setData('stripe_publishable_key', e.target.value)}
                                                disabled={!stripeForm.data.stripe_active}
                                                className="font-mono text-xs h-8"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="stripe_secret_key" className="text-xs">{__('Secret Key')}</Label>
                                            <Input
                                                id="stripe_secret_key"
                                                type="password"
                                                placeholder="sk_test_..."
                                                value={stripeForm.data.stripe_secret_key}
                                                onChange={(e) => stripeForm.setData('stripe_secret_key', e.target.value)}
                                                disabled={!stripeForm.data.stripe_active}
                                                className="font-mono text-xs h-8"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="stripe_webhook_secret" className="text-xs">{__('Webhook Secret')}</Label>
                                            <Input
                                                id="stripe_webhook_secret"
                                                type="password"
                                                placeholder="whsec_..."
                                                value={stripeForm.data.stripe_webhook_secret}
                                                onChange={(e) => stripeForm.setData('stripe_webhook_secret', e.target.value)}
                                                disabled={!stripeForm.data.stripe_active}
                                                className="font-mono text-xs h-8"
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-4 py-3 flex justify-end">
                                        <Button type="submit" size="sm" disabled={stripeForm.processing || !stripeForm.data.stripe_active} className="gap-2 text-xs h-8 bg-indigo-600 hover:bg-indigo-700">
                                            <Save className="h-3.5 w-3.5" />
                                            {__('Guardar Stripe')}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function BadgeStatus({ active }: { active: boolean }) {
    const { __ } = useTranslate();

    return (
        <Badge
            variant={active ? "default" : "secondary"}
            className={active ? "bg-indigo-600 text-white font-bold text-[10px]" : "font-bold text-[10px] text-muted-foreground"}
        >
            {active ? __('Active') : __('Inactive')}
        </Badge>
    );
}

function BadgeWhatsAppStatus({ active, connected }: { active: boolean; connected: boolean }) {
    const { __ } = useTranslate();

    if (!active) {
        return (
            <Badge variant="secondary" className="font-bold text-[10px] text-muted-foreground">
                {__('Inactive')}
            </Badge>
        );
    }

    if (connected) {
        return (
            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                {__('Connected')}
            </Badge>
        );
    }

    return (
        <Badge className="bg-amber-500 text-white font-bold text-[10px]">
            {__('Disconnected')}
        </Badge>
    );
}