import { Head, useForm, router } from '@inertiajs/react';
import { IdCard, Save, Wifi, Loader2, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslate } from '@/hooks/use-translate';

interface PageProps {
    jaak_api_key: string | null;
    jaak_environment: 'sandbox' | 'production';
    jaak_active: boolean;
}

export default function Validaciones({ jaak_api_key, jaak_environment, jaak_active }: PageProps) {
    const { __ } = useTranslate();
    const [testingConnection, setTestingConnection] = useState(false);

    const jaakForm = useForm({
        jaak_api_key: jaak_api_key || '',
        jaak_environment: jaak_environment || 'sandbox',
        jaak_active: jaak_active,
    });

    const handleSaveJaak = (e: React.FormEvent) => {
        e.preventDefault();
        jaakForm.put('/admin/integrations/jaak', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('JAAK integration settings updated successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleTestJaak = () => {
        setTestingConnection(true);
        router.post('/admin/integrations/jaak/test', {}, {
            preserveScroll: true,
            onFinish: () => setTestingConnection(false),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('Validations'), href: '/admin/integrations/validaciones' },
    ];

    return (
        <>
            <Head title={__('Validations')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <IdCard className="h-8 w-8 text-teal-600" />
                            {__('Validations Catalog')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Configure identity verification and KYC providers for your business.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* JAAK Identity Verification */}
                    <Card className="shadow-sm border-t-4 border-t-teal-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-teal-50 dark:bg-teal-950/20 text-teal-600">
                                        <IdCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('JAAK Identity Verification')}</CardTitle>
                                        <CardDescription>{__("Connect to JAAK's KYC API to verify identity documents and biometric data.")}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={jaakForm.data.jaak_active} />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveJaak}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable JAAK')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle the connection to the JAAK identity verification API.')}</p>
                                    </div>
                                    <Switch
                                        checked={jaakForm.data.jaak_active}
                                        onCheckedChange={(checked) => jaakForm.setData('jaak_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jaak_environment">{__('Environment')}</Label>
                                    <Select
                                        value={jaakForm.data.jaak_environment}
                                        onValueChange={(value) => jaakForm.setData('jaak_environment', value as 'sandbox' | 'production')}
                                        disabled={!jaakForm.data.jaak_active}
                                    >
                                        <SelectTrigger id="jaak_environment" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">{__('Sandbox (testing)')}</SelectItem>
                                            <SelectItem value="production">{__('Production (live)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {__('Choose the environment that matches your App Key. Using the wrong environment will cause authentication to fail.')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jaak_api_key">{__('App Key')}</Label>
                                    <Input
                                        id="jaak_api_key"
                                        type="password"
                                        placeholder="eyJhbGciOi..."
                                        value={jaakForm.data.jaak_api_key}
                                        onChange={(e) => jaakForm.setData('jaak_api_key', e.target.value)}
                                        disabled={!jaakForm.data.jaak_active}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">{__('Sent as the Bearer Authorization header on every request.')}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{__('Get your token from')}</span>
                                        <a href="https://www.jaak.ai" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline flex items-center gap-0.5">
                                            jaak.ai <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-950/20"
                                    disabled={!jaakForm.data.jaak_active || testingConnection}
                                    onClick={handleTestJaak}
                                >
                                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                    {__('Test Connection')}
                                </Button>
                                <Button type="submit" disabled={jaakForm.processing || !jaakForm.data.jaak_active} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {__('Save Changes')}
                                </Button>
                            </CardFooter>
                        </form>
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
            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}
