import { Head, router } from '@inertiajs/react';
import { Fingerprint, RefreshCw, Wifi, WifiOff, Cpu, Users, Loader2 } from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';

interface Dispositivo {
    id: number;
    biotime_id: number;
    sn: string | null;
    alias: string | null;
    ip_address: string | null;
    area_name: string | null;
    state: number | null;
    last_activity: string | null;
    fw_ver: string | null;
    user_count: number | null;
    fp_count: number | null;
    face_count: number | null;
    palm_count: number | null;
    transaction_count: number | null;
}

interface PageProps {
    dispositivos: Dispositivo[];
    last_sync_at: string | null;
    biotime_active: boolean;
}

export default function BioTimeDispositivos({ dispositivos, last_sync_at, biotime_active }: PageProps) {
    const { __ } = useTranslate();
    const [syncing, setSyncing] = React.useState(false);

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: 'BioTime', href: '/admin/biotime/dispositivos' },
        { title: __('Devices'), href: '/admin/biotime/dispositivos' },
    ];

    const sync = () => {
        setSyncing(true);
        router.post('/admin/biotime/sync', {}, {
            preserveScroll: true,
            onFinish: () => setSyncing(false),
        });
    };

    return (
        <>
            <Head title={__('BioTime Devices')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Fingerprint className="h-6 w-6 text-white" />}
                    title={__('BioTime Devices')}
                    description={__('Biometric time clocks mirrored from BioTime (read-only).')}
                    colorClassName="bg-rose-600"
                >
                    <Button onClick={sync} disabled={syncing || !biotime_active} variant="secondary" className="gap-2">
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {__('Sync now')}
                    </Button>
                </ModuleHeader>

                {last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                        {__('Last sync:')} {new Date(last_sync_at).toLocaleString()}
                    </p>
                )}

                {dispositivos.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            {__('No devices yet. Run a sync to pull them from BioTime.')}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {dispositivos.map((d) => {
                            const online = Number(d.state) === 1;

                            return (
                                <Card key={d.id} className="border-t-4 border-t-rose-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">{d.alias || d.sn || `#${d.biotime_id}`}</CardTitle>
                                            <span
                                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    online
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400'
                                                }`}
                                            >
                                                {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                                {online ? __('Online') : __('Offline')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-1.5 text-sm">
                                        <Row label={__('Serial')} value={d.sn} mono />
                                        <Row label={__('IP address')} value={d.ip_address} mono />
                                        <Row label={__('Area')} value={d.area_name} />
                                        <Row label={__('Firmware')} value={d.fw_ver} />
                                        <Row
                                            label={__('Last activity')}
                                            value={d.last_activity ? new Date(d.last_activity).toLocaleString() : '—'}
                                        />
                                        <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{d.user_count ?? '—'}</span>
                                            <span className="inline-flex items-center gap-1"><Fingerprint className="h-3.5 w-3.5" />{d.fp_count ?? '—'}</span>
                                            <span className="inline-flex items-center gap-1"><Cpu className="h-3.5 w-3.5" />{d.transaction_count ?? '—'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

function Row({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className={mono ? 'font-mono text-xs' : ''}>{value || '—'}</span>
        </div>
    );
}
