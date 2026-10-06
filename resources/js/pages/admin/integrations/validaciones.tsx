import { Head, useForm, router } from '@inertiajs/react';
import { IdCard, Save, Wifi, Loader2, ExternalLink, FileSignature } from 'lucide-react';
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
    zapsign_api_token: string | null;
    zapsign_environment: 'sandbox' | 'production';
    zapsign_active: boolean;
    didit_api_key?: string | null;
    didit_workflow_id?: string | null;
    didit_active?: boolean;
    didit_webhook_secret_set?: boolean;
    didit_webhook_url?: string;
    reglas?: Regla[];
    zapsign_plantillas?: { token: string; nombre: string; tipo: string | null }[];
    zapsign_variables?: string[];
}

interface Regla {
    entidad: 'colaboradores' | 'visitas' | 'proveedores' | 'socios';
    kyc_activo: boolean;
    didit_antifraude: boolean;
    firma_activa: boolean;
    plantilla_zapsign: string | null;
    nombre_documento: string | null;
    firma_obligatoria: boolean;
    firma_valida_identidad: boolean;
    con_seguimiento: boolean;
}

const ENTIDAD_LABEL: Record<Regla['entidad'], string> = {
    colaboradores: 'Employees',
    visitas: 'Temporary visits',
    proveedores: 'Suppliers and their staff',
    socios: 'Business partners and their staff',
};

export default function Validaciones({
    jaak_api_key,
    jaak_environment,
    jaak_active,
    zapsign_api_token,
    zapsign_environment,
    zapsign_active,
    didit_api_key,
    didit_workflow_id,
    didit_active,
    didit_webhook_secret_set,
    didit_webhook_url,
    reglas = [],
    zapsign_plantillas = [],
    zapsign_variables = [],
}: PageProps) {
    const { __ } = useTranslate();
    const [testingConnection, setTestingConnection] = useState(false);
    const [testingZapsign, setTestingZapsign] = useState(false);
    const [testingDidit, setTestingDidit] = useState(false);

    const jaakForm = useForm({
        jaak_api_key: jaak_api_key || '',
        jaak_environment: jaak_environment || 'sandbox',
        jaak_active: jaak_active,
    });

    const zapsignForm = useForm({
        zapsign_api_token: zapsign_api_token || '',
        zapsign_environment: zapsign_environment || 'production',
        zapsign_active: zapsign_active,
    });

    const diditForm = useForm({
        didit_api_key: didit_api_key || '',
        didit_workflow_id: didit_workflow_id || '',
        didit_active: !!didit_active,
        didit_webhook_secret: '',
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

    const handleSaveZapsign = (e: React.FormEvent) => {
        e.preventDefault();
        zapsignForm.put('/admin/integrations/zapsign', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('ZapSign integration settings updated successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleTestZapsign = () => {
        setTestingZapsign(true);
        router.post('/admin/integrations/zapsign/test', {}, {
            preserveScroll: true,
            onFinish: () => setTestingZapsign(false),
        });
    };

    const handleSaveDidit = (e: React.FormEvent) => {
        e.preventDefault();
        diditForm.put('/admin/integrations/didit', {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('DIDIT integration settings updated successfully.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleTestDidit = () => {
        setTestingDidit(true);
        router.post('/admin/integrations/didit/test', {}, {
            preserveScroll: true,
            onFinish: () => setTestingDidit(false),
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
                                    <div className="p-2 rounded bg-white border border-teal-100 dark:border-teal-900/40">
                                        <img src="/image/logo/integrations/jaak-logo.png" alt="JAAK" className="h-5 w-auto object-contain" />
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

                    {/* ZapSign Electronic Signature */}
                    <Card className="shadow-sm border-t-4 border-t-blue-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded bg-white border border-blue-100 dark:border-blue-900/40">
                                        <img
                                            src="/image/logo/integrations/zapsign-logo.png"
                                            alt="ZapSign"
                                            className="h-5 w-5 object-contain"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileSignature className="h-4 w-4 text-blue-600" />
                                            {__('ZapSign Electronic Signature')}
                                        </CardTitle>
                                        <CardDescription>{__('Connect to the ZapSign API to send documents for electronic signature and track their status.')}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={zapsignForm.data.zapsign_active} tone="blue" />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveZapsign}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable ZapSign')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle the connection to the ZapSign electronic signature API.')}</p>
                                    </div>
                                    <Switch
                                        checked={zapsignForm.data.zapsign_active}
                                        onCheckedChange={(checked) => zapsignForm.setData('zapsign_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="zapsign_environment">{__('Environment')}</Label>
                                    <Select
                                        value={zapsignForm.data.zapsign_environment}
                                        onValueChange={(value) => zapsignForm.setData('zapsign_environment', value as 'sandbox' | 'production')}
                                        disabled={!zapsignForm.data.zapsign_active}
                                    >
                                        <SelectTrigger id="zapsign_environment" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">{__('Sandbox (testing)')}</SelectItem>
                                            <SelectItem value="production">{__('Production (live)')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {__('ZapSign issues a different token per environment. Documents signed in Sandbox have no legal validity.')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="zapsign_api_token">{__('API Token')}</Label>
                                    <Input
                                        id="zapsign_api_token"
                                        type="password"
                                        placeholder="9a6be7d4-c14b-..."
                                        value={zapsignForm.data.zapsign_api_token}
                                        onChange={(e) => zapsignForm.setData('zapsign_api_token', e.target.value)}
                                        disabled={!zapsignForm.data.zapsign_active}
                                        className="font-mono text-sm"
                                    />
                                    {zapsignForm.errors.zapsign_api_token && (
                                        <p className="text-xs text-red-600">{zapsignForm.errors.zapsign_api_token}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">{__('Sent as the Bearer Authorization header on every request.')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {__('Find it in ZapSign under Settings > Integrations > ZapSign API.')}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{__('Get your token from')}</span>
                                        <a href="https://app.zapsign.com.br" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                                            zapsign.com.br <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col gap-2">
                                <div className="flex w-full justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                        disabled={!zapsignForm.data.zapsign_active || testingZapsign}
                                        onClick={handleTestZapsign}
                                    >
                                        {testingZapsign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                        {__('Test Connection')}
                                    </Button>
                                    <Button type="submit" disabled={zapsignForm.processing} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        {__('Save Changes')}
                                    </Button>
                                </div>
                                {zapsignForm.isDirty && (
                                    <p className="w-full text-xs text-amber-600 dark:text-amber-500">
                                        {__('The connection test uses the saved credentials. Save your changes first.')}
                                    </p>
                                )}
                            </CardFooter>
                        </form>
                    </Card>

                    {/* DIDIT Identity Verification */}
                    <Card className="shadow-sm border-t-4 border-t-purple-600 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded bg-white border border-purple-100 dark:border-purple-900/40">
                                        <img
                                            src="/image/logo/integrations/didit-logo.png"
                                            alt="DIDIT"
                                            className="h-6 w-6 rounded object-contain"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div>
                                        <CardTitle>{__('DIDIT Identity Verification')}</CardTitle>
                                        <CardDescription>{__("Connect to DIDIT's API for AI-powered KYC, biometric liveness, and fraud prevention.")}</CardDescription>
                                    </div>
                                </div>
                                <BadgeStatus active={diditForm.data.didit_active} tone="purple" />
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSaveDidit}>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">{__('Enable DIDIT')}</Label>
                                        <p className="text-xs text-muted-foreground">{__('Toggle the connection to the DIDIT identity verification API.')}</p>
                                    </div>
                                    <Switch
                                        checked={diditForm.data.didit_active}
                                        onCheckedChange={(checked) => diditForm.setData('didit_active', checked)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="didit_api_key">{__('API Key')}</Label>
                                    <Input
                                        id="didit_api_key"
                                        type="password"
                                        placeholder="M4gUgMHMyZiiiIE4..."
                                        value={diditForm.data.didit_api_key}
                                        onChange={(e) => diditForm.setData('didit_api_key', e.target.value)}
                                        disabled={!diditForm.data.didit_active}
                                        className="font-mono text-sm"
                                    />
                                    {diditForm.errors.didit_api_key && (
                                        <p className="text-xs text-red-600">{diditForm.errors.didit_api_key}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">{__('Sent as the x-api-key header on every verification request.')}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span>{__('Find your API key in')}</span>
                                        <a href="https://business.didit.me" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-0.5">
                                            business.didit.me <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="didit_workflow_id">{__('Workflow ID')}</Label>
                                    <Input
                                        id="didit_workflow_id"
                                        type="text"
                                        placeholder="d7fe3736-3de9-4bb7-8b63-4bd53f8de50a"
                                        value={diditForm.data.didit_workflow_id}
                                        onChange={(e) => diditForm.setData('didit_workflow_id', e.target.value)}
                                        disabled={!diditForm.data.didit_active}
                                        className="font-mono text-sm"
                                    />
                                    {diditForm.errors.didit_workflow_id && (
                                        <p className="text-xs text-red-600">{diditForm.errors.didit_workflow_id}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {__('ID of the verification flow configured in Didit (e.g. Custom KYC).')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="didit_webhook_secret">{__('Webhook secret')}</Label>
                                    <Input
                                        id="didit_webhook_secret"
                                        type="password"
                                        autoComplete="off"
                                        placeholder={didit_webhook_secret_set ? __('Saved — leave empty to keep it') : __('Paste the secret Didit shows for the webhook')}
                                        value={diditForm.data.didit_webhook_secret}
                                        onChange={(e) => diditForm.setData('didit_webhook_secret', e.target.value)}
                                        disabled={!diditForm.data.didit_active}
                                    />
                                    {didit_webhook_url && (
                                        <p className="text-xs text-muted-foreground break-all">
                                            {__('Webhook URL to register in Didit:')} <code className="font-mono">{didit_webhook_url}</code>
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col gap-2">
                                <div className="flex w-full justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/20"
                                        disabled={!diditForm.data.didit_active || testingDidit}
                                        onClick={handleTestDidit}
                                    >
                                        {testingDidit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                        {__('Test Connection')}
                                    </Button>
                                    <Button type="submit" disabled={diditForm.processing || !diditForm.data.didit_active} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        {__('Save Changes')}
                                    </Button>
                                </div>
                                {diditForm.isDirty && (
                                    <p className="w-full text-xs text-amber-600 dark:text-amber-500">
                                        {__('The connection test uses the saved credentials. Save your changes first.')}
                                    </p>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <ReglasValidacion reglas={reglas} plantillas={zapsign_plantillas} variables={zapsign_variables} />
            </div>
        </>
    );
}

/**
 * Reglas por entidad: qué validaciones corren en cada alta. Identidad: INE →
 * JAAK, pasaporte / extranjero → DIDIT. Antifraude y firma sólo donde el alta
 * ya entrega la liga de seguimiento a la persona.
 */
function ReglasValidacion({ reglas, plantillas, variables }: {
    reglas: Regla[];
    plantillas: { token: string; nombre: string; tipo: string | null }[];
    variables: string[];
}) {
    const { __ } = useTranslate();
    const form = useForm<{ reglas: Regla[] }>({ reglas });

    const set = (i: number, cambios: Partial<Regla>) =>
        form.setData('reglas', form.data.reglas.map((r, j) => (j === i ? { ...r, ...cambios } : r)));

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        form.put('/admin/integrations/validaciones/reglas', { preserveScroll: true });
    };

    return (
        <Card className="shadow-sm">
            <form onSubmit={guardar}>
                <CardHeader>
                    <CardTitle>{__('Validation rules per entity')}</CardTitle>
                    <CardDescription>
                        {__('JAAK validates the INE and passports; with a passport or foreign ID, DIDIT validates as well. Without a rule, registrations work exactly as before.')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {form.data.reglas.map((r, i) => (
                        <div key={r.entidad} className="rounded-xl border p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold">{__(ENTIDAD_LABEL[r.entidad])}</span>
                                {!r.con_seguimiento && (
                                    <span className="text-xs text-muted-foreground">{__('Identity only for now; anti-fraud and signature arrive in a later phase.')}</span>
                                )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                    {__('Identity validation')}
                                    <Switch checked={r.kyc_activo} onCheckedChange={(v) => set(i, { kyc_activo: v })} />
                                </label>
                                <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                    {__('DIDIT anti-fraud on top of JAAK')}
                                    <Switch checked={r.didit_antifraude} disabled={!r.con_seguimiento || !r.kyc_activo} onCheckedChange={(v) => set(i, { didit_antifraude: v })} />
                                </label>
                                <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                    {__('ZapSign signature')}
                                    <Switch checked={r.firma_activa} disabled={!r.con_seguimiento} onCheckedChange={(v) => set(i, { firma_activa: v })} />
                                </label>
                            </div>
                            {r.con_seguimiento && r.firma_activa && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>{__('ZapSign template')}</Label>
                                        {plantillas.length > 0 ? (
                                            <Select value={r.plantilla_zapsign ?? ''} onValueChange={(v) => set(i, { plantilla_zapsign: v })}>
                                                <SelectTrigger><SelectValue placeholder={__('Choose a template')} /></SelectTrigger>
                                                <SelectContent>
                                                    {plantillas.map((p) => (
                                                        <SelectItem key={p.token} value={p.token}>
                                                            {p.nombre}{p.tipo ? ` (${p.tipo.toUpperCase()})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input value={r.plantilla_zapsign ?? ''} placeholder={__('Template token')} onChange={(e) => set(i, { plantilla_zapsign: e.target.value })} />
                                        )}
                                        {form.errors[`reglas.${i}.plantilla_zapsign` as keyof typeof form.errors] && (
                                            <p className="text-xs text-red-600">{form.errors[`reglas.${i}.plantilla_zapsign` as keyof typeof form.errors]}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{__('Document name')}</Label>
                                        <Input value={r.nombre_documento ?? ''} placeholder={__('e.g. Privacy notice')} maxLength={120} onChange={(e) => set(i, { nombre_documento: e.target.value })} />
                                    </div>
                                    <label className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm sm:col-span-2">
                                        <span>
                                            {__('ZapSign also validates the signer\'s INE or passport')}
                                            <span className="block text-xs text-muted-foreground">
                                                {__('INE: biometrics + Mexican government databases (~US$1.00). Passport or foreign ID: biometrics and document anti-fraud, any country (~US$0.90). Charged by ZapSign per signature.')}
                                            </span>
                                        </span>
                                        <Switch checked={r.firma_valida_identidad} onCheckedChange={(v) => set(i, { firma_valida_identidad: v })} />
                                    </label>
                                    <p className="text-xs text-muted-foreground sm:col-span-2">
                                        {__('DOCX templates get their variables filled:')} <code className="font-mono">{variables.join(' ')}</code>. {__('PDF templates are sent as they are.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="border-t px-6 py-4 justify-end">
                    <Button type="submit" disabled={form.processing || !form.isDirty} className="gap-2">
                        <Save className="h-4 w-4" />
                        {__('Save rules')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

function BadgeStatus({ active, tone = 'teal' }: { active: boolean; tone?: 'teal' | 'blue' | 'purple' }) {
    const { __ } = useTranslate();

    const activeTone = tone === 'blue'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
        : tone === 'purple'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300';

    return (
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${active
            ? activeTone
            : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}>
            {active ? __('Active') : __('Inactive')}
        </span>
    );
}
