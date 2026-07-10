import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Settings2, Map, ShieldCheck, Save, MessageSquare, CreditCard, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import Swal from 'sweetalert2';

interface PageProps {
    mapbox_api_key: string | null;
    mapbox_active: boolean;
}

export default function Integrations({ mapbox_api_key, mapbox_active }: PageProps) {
    const { __ } = useTranslate();

    const { data, setData, put, processing } = useForm({
        mapbox_api_key: mapbox_api_key || '',
        mapbox_active: mapbox_active,
    });

    const handleSaveMapbox = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/integrations/mapbox', {
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
                                <BadgeStatus active={data.mapbox_active} />
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
                                        checked={data.mapbox_active}
                                        onCheckedChange={(checked) => setData('mapbox_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mapbox_api_key">{__('Mapbox Access Token')}</Label>
                                    <Input
                                        id="mapbox_api_key"
                                        type="password"
                                        placeholder="pk.eyJ1..."
                                        value={data.mapbox_api_key}
                                        onChange={(e) => setData('mapbox_api_key', e.target.value)}
                                        disabled={!data.mapbox_active}
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
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-end">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {__('Save Settings')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Placeholder Premium 1: WhatsApp Integration */}
                    <Card className="shadow-sm border-t-4 border-t-emerald-600 opacity-80 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>{__('WhatsApp API')}</CardTitle>
                                    <CardDescription>{__('Automate customer messaging and trigger notification alerts.')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                            <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2" />
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{__('Fully Integrated')}</p>
                            <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                {__('WhatsApp settings are configured dynamically within each individual Company profile.')}
                            </p>
                        </CardContent>
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
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
            active 
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' 
                : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
        }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}
