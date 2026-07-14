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
import { useTranslate } from '@/hooks/use-translate';

interface PageProps {
    mapbox_api_key: string | null;
    mapbox_active: boolean;
    google_maps_api_key: string | null;
    google_maps_active: boolean;
    whatsapp_active: boolean;
    whatsapp_connected: boolean;
}

export default function Integrations({ 
    mapbox_api_key, 
    mapbox_active, 
    google_maps_api_key,
    google_maps_active,
    whatsapp_active, 
    whatsapp_connected 
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
                                        <p className="text-xs text-muted-foreground">{__('Enable Google Maps for routing and geocoding in Venezuela.')}</p>
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

                    {/* WhatsApp Integration */}
                    <Card className="shadow-sm border-t-4 border-t-emerald-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('WhatsApp API')}</CardTitle>
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

                    {/* Placeholder Premium 2: Stripe Integration */}
                    <Card className="shadow-sm border-t-4 border-t-blue-600 opacity-60 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>{__('Stripe Billing')}</CardTitle>
                                    <CardDescription>{__('Accept credit card payments and manage subscriptions.')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                            <p className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {__('Coming Soon')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                                {__('Currently developing support for automated SaaS recurring credit cards billing.')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function BadgeStatus({ active }: { active: boolean }) {
    const { __ } = useTranslate();

    return (
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${active
            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}

function BadgeWhatsAppStatus({ active, connected }: { active: boolean; connected: boolean }) {
    const { __ } = useTranslate();

    if (!active) {
        return (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {__('Inactive')}
            </span>
        );
    }

    if (connected) {
        return (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {__('Connected')}
            </span>
        );
    }

    return (
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {__('Disconnected')}
        </span>
    );
}