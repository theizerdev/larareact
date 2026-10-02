import { Head, useForm, router } from '@inertiajs/react';
import { ShieldCheck, Save, Wifi, Loader2 } from 'lucide-react';
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
    control_acceso_base_url: string | null;
    control_acceso_app_token: string | null;
    control_acceso_user_token: string | null;
    control_acceso_active: boolean;
}

export default function ControlAccesoIntegration({
    control_acceso_base_url,
    control_acceso_app_token,
    control_acceso_user_token,
    control_acceso_active,
}: PageProps) {
    const { __ } = useTranslate();
    const [testingConnection, setTestingConnection] = useState(false);

    const controlAccesoForm = useForm({
        control_acceso_base_url: control_acceso_base_url || '',
        control_acceso_app_token: control_acceso_app_token || '',
        control_acceso_user_token: control_acceso_user_token || '',
        control_acceso_active: control_acceso_active,
    });

    const handleSaveControlAcceso = (e: React.FormEvent) => {
        e.preventDefault();
        controlAccesoForm.put('/admin/integrations/control-acceso', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('Access Control middleware settings updated successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleTestControlAcceso = () => {
        setTestingConnection(true);
        router.post('/admin/integrations/control-acceso/test', {}, {
            preserveScroll: true,
            onFinish: () => setTestingConnection(false),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('Access Control'), href: '/admin/integrations/control-acceso' },
    ];

    return (
        <>
            <Head title={__('Access Control')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-purple-600" />
                            {__('Access Control')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Connect to the external Access Control middleware to authenticate requests such as employee lookups.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Control de Acceso Middleware Integration */}
                    <Card className="shadow-sm border-t-4 border-t-purple-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('Access Control Middleware')}</CardTitle>
                                        <CardDescription>{__('Connect to the external Access Control middleware to authenticate requests such as employee lookups.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={controlAccesoForm.data.control_acceso_active} />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveControlAcceso}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable Access Control Middleware')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle the connection to the external Access Control middleware service.')}</p>
                                    </div>
                                    <Switch
                                        checked={controlAccesoForm.data.control_acceso_active}
                                        onCheckedChange={(checked) => controlAccesoForm.setData('control_acceso_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="control_acceso_base_url">{__('Base URL')}</Label>
                                    <Input
                                        id="control_acceso_base_url"
                                        type="text"
                                        placeholder="https://tu-middleware.ejemplo.com"
                                        value={controlAccesoForm.data.control_acceso_base_url}
                                        onChange={(e) => controlAccesoForm.setData('control_acceso_base_url', e.target.value)}
                                        disabled={!controlAccesoForm.data.control_acceso_active}
                                        className="font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="control_acceso_app_token">{__('App Token')}</Label>
                                    <Input
                                        id="control_acceso_app_token"
                                        type="password"
                                        placeholder="shk_..."
                                        value={controlAccesoForm.data.control_acceso_app_token}
                                        onChange={(e) => controlAccesoForm.setData('control_acceso_app_token', e.target.value)}
                                        disabled={!controlAccesoForm.data.control_acceso_active}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">{__('Sent as the Bearer Authorization header on every request.')}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="control_acceso_user_token">{__('User Token')}</Label>
                                    <Input
                                        id="control_acceso_user_token"
                                        type="password"
                                        placeholder="usr_..."
                                        value={controlAccesoForm.data.control_acceso_user_token}
                                        onChange={(e) => controlAccesoForm.setData('control_acceso_user_token', e.target.value)}
                                        disabled={!controlAccesoForm.data.control_acceso_active}
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">{__('Sent as the X-User-Token header on every request.')}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/20"
                                    disabled={!controlAccesoForm.data.control_acceso_active || testingConnection}
                                    onClick={handleTestControlAcceso}
                                >
                                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                    {__('Test Connection')}
                                </Button>
                                <Button type="submit" disabled={controlAccesoForm.processing || !controlAccesoForm.data.control_acceso_active} className="gap-2">
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
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}
