import { Head, useForm, Link } from '@inertiajs/react';
import { Settings2, Map, ShieldCheck, Save, MessageSquare, CreditCard, ExternalLink, Star, CheckCircle2, Zap, Loader2 } from 'lucide-react';
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
    primary_payment_gateway?: string;
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
    stripe_webhook_secret = '',
    primary_payment_gateway = 'stripe'
}: PageProps) {
    const { __ } = useTranslate();
    const [testingStripe, setTestingStripe] = useState(false);

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
        is_primary: primary_payment_gateway === 'stripe',
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

    const handleTestStripe = async () => {
        if (!stripeForm.data.stripe_secret_key) {
            Swal.fire({
                title: __('Clave Secreta Requerida'),
                text: __('Por favor introduce la Secret Key de Stripe antes de probar la conexión.'),
                icon: 'warning',
            });
            return;
        }

        setTestingStripe(true);
        try {
            const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            const xsrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
            if (metaToken) headers['X-CSRF-TOKEN'] = metaToken;

            const res = await fetch('/admin/integrations/stripe/test', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({ stripe_secret_key: stripeForm.data.stripe_secret_key }),
            });

            const result = await res.json().catch(() => ({ success: false, message: __('Respuesta no válida del servidor.') }));
            if (result.success) {
                Swal.fire({
                    title: __('¡Conexión Exitosa!'),
                    text: result.message + (result.livemode ? ' (Modo PRODUCCIÓN)' : ' (Modo TEST / PRUEBAS)'),
                    icon: 'success',
                });
            } else {
                Swal.fire({
                    title: __('Error de Conexión'),
                    text: result.message || __('No se pudo validar la clave de Stripe.'),
                    icon: 'error',
                });
            }
        } catch (e: any) {
            Swal.fire({
                title: __('Error de Conexión'),
                text: e.message || __('No se pudo conectar con el servidor.'),
                icon: 'error',
            });
        } finally {
            setTestingStripe(false);
        }
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
                    {/* Leaflet.js Integration (Default & Free) */}
                    <Card className="shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                                        <Map className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('Leaflet.js / OpenStreetMap')}</CardTitle>
                                        <CardDescription>{__('Open source interactive map engine. Free and no API key required.')}</CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {__('Active (Default)')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                {__('Leaflet.js is integrated and activated as the default map viewer for selecting locations of branches, companies, countries, and clients.')}
                            </p>
                            <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 border space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span>{__('Leaflet.js Features')}</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>{__('Tile providers: OpenStreetMap & CartoDB (Light / Dark Mode)')}</li>
                                    <li>{__('Free reverse geocoding via Nominatim OSM')}</li>
                                    <li>{__('Unlimited requests and zero API costs')}</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-between">
                            <span className="text-xs text-emerald-600 font-semibold">{__('100% Operational')}</span>
                            <Link href="/admin/integrations/map">
                                <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-400">
                                    <Map className="h-4 w-4" />
                                    {__('View Routes')}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

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
                                <CreditCard className="h-6 w-6 text-indigo-600" />
                                {__('Pasarelas de Pago SaaS (Cobro de Suscripciones)')}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {__('Configuración global de pasarelas de pago online para recibir los cobros por renovación de licencias de la plataforma.')}
                            </p>
                        </div>

                        {/* Banner Informativo: Stripe como Método Principal de Suscripción */}
                        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-950 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-sky-50/50 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-sky-950/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-md">
                                    <Star className="h-5 w-5 fill-white text-white" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                                            {__('Stripe: Pasarela de Pago Principal del Sistema')}
                                        </span>
                                        <Badge className="bg-indigo-600 text-white font-bold text-[10px]">
                                            ⭐ {__('Método Principal')}
                                        </Badge>
                                        <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:text-indigo-300 text-[10px]">
                                            ⚡ {__('Acreditación Instantánea')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                                        {__('Stripe está configurado como el método principal en todo el sistema para suscripciones SaaS y renovaciones de membresías con tarjetas Visa, Mastercard, American Express, Apple Pay y Google Pay.')}
                                    </p>
                                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 inline-block">
                                        🔒 {__('Exclusivo para pagos de suscripciones del sistema. No afecta ni interfiere con los métodos de cobro del Punto de Venta (POS).')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Stripe Integration - MÉTODO PRINCIPAL */}
                            <Card className="shadow-md border-2 border-indigo-500/80 dark:border-indigo-500 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20">
                                <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Star className="h-3 w-3 fill-white" />
                                        {__('Método Principal de Suscripción')}
                                    </span>
                                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">RECOMENDADO</span>
                                </div>
                                <CardHeader className="pt-3 pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 font-extrabold text-sm tracking-tight border border-indigo-200 dark:border-indigo-800">
                                                ST
                                            </div>
                                            <div>
                                                <CardTitle className="text-base flex items-center gap-1.5">
                                                    {__('Stripe')}
                                                    <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] border-indigo-200">
                                                        ⭐ {__('Principal')}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="text-xs">{__('Tarjetas globales & Checkout SaaS')}</CardDescription>
                                            </div>
                                        </div>
                                        <BadgeStatus active={stripeForm.data.stripe_active} />
                                    </div>
                                </CardHeader>
                                <form onSubmit={handleSaveStripe}>
                                    <CardContent className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between p-2.5 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40">
                                            <div>
                                                <Label className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">{__('Habilitar Stripe')}</Label>
                                                <p className="text-[11px] text-muted-foreground">{__('Activar cobros con tarjeta para suscripciones')}</p>
                                            </div>
                                            <Switch
                                                checked={stripeForm.data.stripe_active}
                                                onCheckedChange={(checked) => stripeForm.setData('stripe_active', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <div className="space-y-0.5">
                                                <Label className="text-xs font-medium flex items-center gap-1">
                                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                    {__('Pasarela Principal')}
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground">{__('Seleccionada por defecto en renovaciones')}</p>
                                            </div>
                                            <Switch
                                                checked={stripeForm.data.is_primary}
                                                onCheckedChange={(checked) => stripeForm.setData('is_primary', checked)}
                                                disabled={!stripeForm.data.stripe_active}
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
                                                    <SelectItem value="test">🧪 {__('Test (Pruebas)')}</SelectItem>
                                                    <SelectItem value="live">🚀 {__('Live (Producción)')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="stripe_publishable_key" className="text-xs">{__('Publishable Key')}</Label>
                                            <Input
                                                id="stripe_publishable_key"
                                                type="text"
                                                placeholder="pk_test_... o pk_live_..."
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
                                                placeholder="sk_test_... o sk_live_..."
                                                value={stripeForm.data.stripe_secret_key}
                                                onChange={(e) => stripeForm.setData('stripe_secret_key', e.target.value)}
                                                disabled={!stripeForm.data.stripe_active}
                                                className="font-mono text-xs h-8"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="stripe_webhook_secret" className="text-xs">{__('Webhook Secret (Opcional)')}</Label>
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
                                    <CardFooter className="border-t bg-slate-50/60 dark:bg-slate-900/20 px-4 py-3 flex items-center justify-between gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleTestStripe}
                                            disabled={testingStripe || !stripeForm.data.stripe_secret_key}
                                            className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-300"
                                        >
                                            {testingStripe ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                                            )}
                                            {__('Probar Conexión')}
                                        </Button>

                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={stripeForm.processing || !stripeForm.data.stripe_active}
                                            className="gap-2 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            {__('Guardar Stripe')}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>

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