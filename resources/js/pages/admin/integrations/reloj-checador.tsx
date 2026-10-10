import { Head, useForm, Link, router } from '@inertiajs/react';
import { Cloud, Fingerprint, Loader2, Network, Save, Settings2, Wifi } from 'lucide-react';
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
    biotime_base_url: string | null;
    biotime_username: string | null;
    biotime_password_set: boolean;
    biotime_active: boolean;
    biotime_auto_alta: boolean;
    biotime_last_sync_at: string | null;
}

export default function RelojChecadorIntegration({
    biotime_base_url,
    biotime_username,
    biotime_password_set,
    biotime_active,
    biotime_auto_alta,
    biotime_last_sync_at,
}: PageProps) {
    const { __ } = useTranslate();
    const [testingBiotime, setTestingBiotime] = useState(false);

    const biotimeForm = useForm({
        biotime_base_url: biotime_base_url || '',
        biotime_username: biotime_username || '',
        biotime_password: '',
        biotime_active: biotime_active,
        biotime_auto_alta: biotime_auto_alta,
    });

    const handleSaveBioTime = (e: React.FormEvent) => {
        e.preventDefault();
        biotimeForm.put('/admin/integrations/biotime', {
            preserveScroll: true,
            onSuccess: () => {
                biotimeForm.setData('biotime_password', '');
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('BioTime integration settings updated successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleTestBioTime = () => {
        setTestingBiotime(true);
        router.post('/admin/integrations/biotime/test', {}, {
            preserveScroll: true,
            onFinish: () => setTestingBiotime(false),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Settings'), href: '#' },
        { title: __('Integrations'), href: '/admin/integrations' },
        { title: __('Time Clock'), href: '/admin/integrations/reloj-checador' },
    ];

    return (
        <>
            <Head title={__('Time Clock')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Fingerprint className="h-8 w-8 text-rose-600" />
                            {__('Time Clock')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Read-only mirror of biometric clocks, employees, catalogs and punches from BioTime Cloud.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* BioTime Cloud (ZKTeco) — asistencia biométrica */}
                    <Card className="shadow-sm border-t-4 border-t-rose-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                                        <Fingerprint className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('BioTime Cloud (ZKTeco)')}</CardTitle>
                                        <CardDescription>{__('Read-only mirror of biometric clocks, employees, catalogs and punches from BioTime Cloud.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={biotimeForm.data.biotime_active} />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveBioTime}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable BioTime')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle the scheduled read-only sync from BioTime.')}</p>
                                    </div>
                                    <Switch
                                        checked={biotimeForm.data.biotime_active}
                                        onCheckedChange={(checked) => biotimeForm.setData('biotime_active', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5 pr-4">
                                        <Label className="text-sm font-medium">{__('Create and update employees automatically')}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {__('Every sync registers new BioTime employees in this company and keeps their data up to date.')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={biotimeForm.data.biotime_auto_alta}
                                        onCheckedChange={(checked) => biotimeForm.setData('biotime_auto_alta', checked)}
                                        disabled={!biotimeForm.data.biotime_active}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="biotime_base_url">{__('Server URL')}</Label>
                                    <Input
                                        id="biotime_base_url"
                                        type="text"
                                        dir="ltr"
                                        placeholder="https://empresa.biotimecloud.com"
                                        value={biotimeForm.data.biotime_base_url}
                                        onChange={(e) => biotimeForm.setData('biotime_base_url', e.target.value)}
                                        disabled={!biotimeForm.data.biotime_active}
                                        className="font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="biotime_username">{__('Username')}</Label>
                                    <Input
                                        id="biotime_username"
                                        type="text"
                                        dir="ltr"
                                        placeholder="usuario@empresa.com"
                                        value={biotimeForm.data.biotime_username}
                                        onChange={(e) => biotimeForm.setData('biotime_username', e.target.value)}
                                        disabled={!biotimeForm.data.biotime_active}
                                        className="font-mono text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="biotime_password">{__('Password')}</Label>
                                    <Input
                                        id="biotime_password"
                                        type="password"
                                        placeholder={biotime_password_set ? __('•••••••• (unchanged)') : ''}
                                        value={biotimeForm.data.biotime_password}
                                        onChange={(e) => biotimeForm.setData('biotime_password', e.target.value)}
                                        disabled={!biotimeForm.data.biotime_active}
                                        className="font-mono text-sm"
                                        autoComplete="new-password"
                                    />
                                    <p className="text-xs text-muted-foreground">{__('Stored encrypted. Leave blank to keep the saved one. Read-only: only GET requests are sent to BioTime.')}</p>
                                </div>

                                {biotime_last_sync_at && (
                                    <p className="text-xs text-muted-foreground">
                                        {__('Last sync:')} {new Date(biotime_last_sync_at).toLocaleString()}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-wrap justify-between gap-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                                        disabled={!biotimeForm.data.biotime_active || testingBiotime}
                                        onClick={handleTestBioTime}
                                    >
                                        {testingBiotime ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                        {__('Test Connection')}
                                    </Button>
                                    <Link href="/admin/biotime/dispositivos">
                                        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!biotime_active}>
                                            <Settings2 className="h-4 w-4" />
                                            {__('View data')}
                                        </Button>
                                    </Link>
                                </div>
                                <Button type="submit" disabled={biotimeForm.processing || !biotimeForm.data.biotime_active} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {__('Save Changes')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Integraciones de RR. HH. previstas (SuccessFactors → MuleSoft → BioTime).
                        Se muestran para que el cliente vea el flujo acordado; aún no
                        hay servicio activo ni credenciales que capturar. */}
                    <div className="grid gap-6">
                        <PendingIntegrationCard
                            icon={<Cloud className="h-5 w-5" />}
                            title={__('SAP BTP')}
                            description={__('SAP Business Technology Platform. Source of employee master data from SuccessFactors Employee Central.')}
                        />
                        <PendingIntegrationCard
                            icon={<Network className="h-5 w-5" />}
                            title={__('MuleSoft')}
                            description={__('Integration layer between SuccessFactors Employee Central and BioTime. Employee data will be consumed through its API.')}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

function PendingIntegrationCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    const { __ } = useTranslate();

    return (
        <Card className="shadow-sm border-t-4 border-t-slate-400">
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                            {icon}
                        </div>
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {__('No active service')}
                    </span>
                </div>
            </CardHeader>
        </Card>
    );
}

function BadgeStatus({ active }: { active: boolean }) {
    const { __ } = useTranslate();

    return (
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${active
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}
