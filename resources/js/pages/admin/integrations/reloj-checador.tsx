import { Head, useForm, Link, router } from '@inertiajs/react';
import { Fingerprint, Settings2, Save, Wifi, Loader2 } from 'lucide-react';
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
    biotime_last_sync_at: string | null;
}

export default function RelojChecadorIntegration({
    biotime_base_url,
    biotime_username,
    biotime_password_set,
    biotime_active,
    biotime_last_sync_at,
}: PageProps) {
    const { __ } = useTranslate();
    const [testingBiotime, setTestingBiotime] = useState(false);

    const biotimeForm = useForm({
        biotime_base_url: biotime_base_url || '',
        biotime_username: biotime_username || '',
        biotime_password: '',
        biotime_active: biotime_active,
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
                            {__('Read-only mirror of biometric clocks, employees, catalogs and punches from BioTime 8.0.')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* BioTime PRO (ZKTeco) — asistencia biométrica */}
                    <Card className="shadow-sm border-t-4 border-t-rose-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                                        <Fingerprint className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>{__('BioTime PRO (ZKTeco)')}</CardTitle>
                                        <CardDescription>{__('Read-only mirror of biometric clocks, employees, catalogs and punches from BioTime 8.0.')}</CardDescription>
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

                                <div className="space-y-2">
                                    <Label htmlFor="biotime_base_url">{__('Server URL')}</Label>
                                    <Input
                                        id="biotime_base_url"
                                        type="text"
                                        placeholder="http://187.201.95.48:8081"
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
                                        placeholder="Sistemas"
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
                                        placeholder={biotime_password_set ? '•••••••• (unchanged)' : ''}
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
                </div>
            </div>
        </>
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
