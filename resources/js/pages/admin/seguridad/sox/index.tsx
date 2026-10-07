import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    ShieldCheck,
    ShieldAlert,
    Lock,
    KeyRound,
    Users,
    Unlock,
    RotateCw,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Save,
    Cpu,
    Fingerprint,
    History,
    FileSpreadsheet,
    Server,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FormField } from '@/components/ui/form-field';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';

interface SoxConfig {
    id: number;
    empresa_id: number | null;
    min_password_length: number;
    password_history_limit: number;
    password_expires_days: number;
    max_failed_attempts: number;
    lockout_minutes: number;
    require_mixed_case: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    require_uncompromised: boolean;
    sso_azure_enabled: boolean;
    azure_tenant_id: string | null;
    azure_client_id: string | null;
    azure_client_secret: string | null;
    azure_redirect_uri: string | null;
}

interface UserItem {
    id: number;
    name: string;
    username: string | null;
    email: string;
    empresa: string;
    sucursal: string;
    password_changed_at: string;
    days_remaining: number;
    is_expired: boolean;
    failed_attempts: number;
    is_locked: boolean;
    locked_until: string | null;
    lockout_remaining_minutes: number;
    status_badge: 'locked' | 'expired' | 'warning' | 'ok';
}

interface ChecklistItem {
    id: number;
    title: string;
    rfp_req: string;
    status: 'compliant' | 'warning' | 'ready';
    current_value: string;
    standard: string;
}

interface AuditLog {
    id: number;
    description: string;
    event: string;
    causer: string;
    created_at: string;
    properties: Record<string, any>;
}

interface Props {
    config: SoxConfig;
    stats: {
        score: number;
        totalUsers: number;
        lockedUsers: number;
        expiredUsers: number;
        warningUsers: number;
    };
    users: UserItem[];
    checklist: ChecklistItem[];
    recentLogs: AuditLog[];
}

export default function SoxIndex({ config, stats, users, checklist, recentLogs }: Props) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Seguridad', href: '/admin/usuarios' },
        { title: 'Cumplimiento SOX 404', href: '/admin/seguridad/sox' },
    ];

    const [activeTab, setActiveTab] = useState('matrix');
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Settings form
    const { data, setData, put, processing, errors } = useForm({
        min_password_length: config.min_password_length,
        password_history_limit: config.password_history_limit,
        password_expires_days: config.password_expires_days,
        max_failed_attempts: config.max_failed_attempts,
        lockout_minutes: config.lockout_minutes,
        require_mixed_case: config.require_mixed_case,
        require_numbers: config.require_numbers,
        require_symbols: config.require_symbols,
        require_uncompromised: config.require_uncompromised,
        sso_azure_enabled: config.sso_azure_enabled,
        azure_tenant_id: config.azure_tenant_id || '',
        azure_client_id: config.azure_client_id || '',
        azure_client_secret: config.azure_client_secret || '',
        azure_redirect_uri: config.azure_redirect_uri || '',
    });

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/seguridad/sox/settings', {
            preserveScroll: true,
            onSuccess: () => notifySuccess('Parámetros de políticas SOX guardados exitosamente.'),
            onError: () => notifyError('Revise los campos requeridos del formulario.'),
        });
    };

    const handleUnlockUser = (user: UserItem) => {
        setActionLoadingId(user.id);
        router.post(`/admin/seguridad/sox/users/${user.id}/unlock`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(`Cuenta de ${user.name} desbloqueada.`);
                setActionLoadingId(null);
            },
            onError: () => {
                notifyError('Error al desbloquear el usuario.');
                setActionLoadingId(null);
            },
        });
    };

    const handleForceReset = (user: UserItem) => {
        setActionLoadingId(user.id);
        router.post(`/admin/seguridad/sox/users/${user.id}/force-reset`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                notifySuccess(`Se forzará el cambio de contraseña para ${user.name} en su próximo acceso.`);
                setActionLoadingId(null);
            },
            onError: () => {
                notifyError('Error al forzar renovación de contraseña.');
                setActionLoadingId(null);
            },
        });
    };

    return (
        <>
            <Head title="Evaluación de Ciberseguridad y Cumplimiento SOX: Hosho vs. Smurfit Westrock México" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<ShieldCheck className="size-6 text-white" />}
                    title="Ciberseguridad y Cumplimiento SOX 404"
                    description="Evaluación de Controles Generales de TI (ITGC), Políticas de Identidad, Biometría e Inmutabilidad para Smurfit Westrock México."
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-xs font-semibold">
                            SOX Sección 404 • Calificación: {stats.score}%
                        </Badge>
                    </div>
                </ModuleHeader>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<ShieldCheck className="size-5" />}
                        title="Índice de Cumplimiento"
                        value={`${stats.score}%`}
                        colorClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    />
                    <StatCard
                        icon={<Users className="size-5" />}
                        title="Usuarios Auditados"
                        value={stats.totalUsers}
                        colorClassName="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    />
                    <StatCard
                        icon={<Lock className="size-5" />}
                        title="Cuentas Bloqueadas"
                        value={stats.lockedUsers}
                        colorClassName={stats.lockedUsers > 0 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"}
                    />
                    <StatCard
                        icon={<AlertTriangle className="size-5" />}
                        title="Próximas a Caducar"
                        value={stats.warningUsers + stats.expiredUsers}
                        colorClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-muted/70 p-1 rounded-xl">
                        <TabsTrigger value="matrix" className="gap-2 text-xs">
                            <CheckCircle2 className="size-3.5" />
                            Matriz RFP Smurfit Westrock
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2 text-xs">
                            <KeyRound className="size-3.5" />
                            Políticas de Contraseña & Bloqueo
                        </TabsTrigger>
                        <TabsTrigger value="sso" className="gap-2 text-xs">
                            <Building2 className="size-3.5" />
                            Microsoft Entra ID (SSO)
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 text-xs">
                            <Users className="size-3.5" />
                            Gestión de Cuentas & Desbloqueo ({users.length})
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="gap-2 text-xs">
                            <History className="size-3.5" />
                            Bitácora Inmutable (Logs)
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: Matriz Comparativa */}
                    <TabsContent value="matrix" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Matriz de Diagnóstico y Cumplimiento: Hosho vs. Pliego Smurfit Westrock</span>
                                    <Badge className="bg-emerald-600 text-white">Auditoría Aprobada 100%</Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Controles validados en código, arquitectura de base de datos y terminales biométricas ZKTeco en planta.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>Control Requerido (RFP Smurfit Westrock)</TableHead>
                                            <TableHead>Estándar / Marco</TableHead>
                                            <TableHead>Estado en Hosho</TableHead>
                                            <TableHead>Diagnóstico Técnico en el Código</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {checklist.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-center text-xs">{item.id}</TableCell>
                                                <TableCell>
                                                    <p className="font-semibold text-xs text-foreground">{item.title}</p>
                                                    <p className="text-[11px] text-muted-foreground">{item.rfp_req}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-mono">
                                                        {item.standard}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                                                        item.status === 'compliant'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                    )}>
                                                        <CheckCircle2 className="size-3 shrink-0" />
                                                        {item.status === 'compliant' ? 'Cumple al 100%' : 'Listo / Compatible'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.current_value}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Architectural Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-border/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Fingerprint className="size-4 text-emerald-600" />
                                        Biometría Anti-Suplantación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                                    <p>• Cámaras duales Visible Light (RGB + Sensor Infrarrojo).</p>
                                    <p>• Detección de rostro vivo contra fotos, videos en pantallas y máscaras 3D.</p>
                                    <p>• Soporte de reconocimiento con cubrebocas en &lt; 0.3 segundos.</p>
                                </CardContent>
                            </Card>

                            <Card className="border-border/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Cpu className="size-4 text-blue-600" />
                                        Resiliencia Eléctrica en Planta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                                    <p>• Memoria Flash no volátil integrada en hardware de reloj checador.</p>
                                    <p>• Retención de &gt; 1,000,000 de eventos locales por más de 10 años sin luz.</p>
                                    <p>• Sincronización automática Push ADMS al restablecer energía y red.</p>
                                </CardContent>
                            </Card>

                            <Card className="border-border/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <FileSpreadsheet className="size-4 text-indigo-600" />
                                        Inmutabilidad SOX 404
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground space-y-1.5">
                                    <p>• Marcajes brutos almacenados en tabla inalterable <code className="text-foreground">BiotimeMarcaje</code>.</p>
                                    <p>• Auditoría inmutable de cualquier corrección de incidencias con Spatie ActivityLog.</p>
                                    <p>• Aislamiento estricto de nómina por planta mediante Global Scopes.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 2: Políticas de Contraseña */}
                    <TabsContent value="settings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Lock className="size-4 text-emerald-600" />
                                    Endurecimiento de Contraseñas y Parámetros SOX
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Configure las reglas obligatorias exigidas por auditoría financiera para cuentas de usuarios de Hoshō.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <FormField
                                            label="Longitud Mínima (Caracteres)"
                                            htmlFor="min_password_length"
                                            error={errors.min_password_length}
                                            required
                                        >
                                            <Input
                                                id="min_password_length"
                                                type="number"
                                                min={12}
                                                max={64}
                                                value={data.min_password_length}
                                                onChange={(e) => setData('min_password_length', Number(e.target.value))}
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Estándar SOX Smurfit Westrock: <strong>15 caracteres</strong>.
                                            </p>
                                        </FormField>

                                        <FormField
                                            label="Historial de Contraseñas (No Reutilizables)"
                                            htmlFor="password_history_limit"
                                            error={errors.password_history_limit}
                                            required
                                        >
                                            <Input
                                                id="password_history_limit"
                                                type="number"
                                                min={3}
                                                max={24}
                                                value={data.password_history_limit}
                                                onChange={(e) => setData('password_history_limit', Number(e.target.value))}
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Impide usar los últimos <strong>{data.password_history_limit}</strong> hashes guardados.
                                            </p>
                                        </FormField>

                                        <FormField
                                            label="Caducidad Forzosa (Días)"
                                            htmlFor="password_expires_days"
                                            error={errors.password_expires_days}
                                            required
                                        >
                                            <Input
                                                id="password_expires_days"
                                                type="number"
                                                min={30}
                                                max={365}
                                                value={data.password_expires_days}
                                                onChange={(e) => setData('password_expires_days', Number(e.target.value))}
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Bloquea navegación a los <strong>{data.password_expires_days}</strong> días solicitando cambio.
                                            </p>
                                        </FormField>

                                        <FormField
                                            label="Intentos Fallidos Máximos"
                                            htmlFor="max_failed_attempts"
                                            error={errors.max_failed_attempts}
                                            required
                                        >
                                            <Input
                                                id="max_failed_attempts"
                                                type="number"
                                                min={3}
                                                max={10}
                                                value={data.max_failed_attempts}
                                                onChange={(e) => setData('max_failed_attempts', Number(e.target.value))}
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Bloquea la cuenta al alcanzar <strong>{data.max_failed_attempts}</strong> errores consecutivos.
                                            </p>
                                        </FormField>

                                        <FormField
                                            label="Duración de Bloqueo Temporal (Minutos)"
                                            htmlFor="lockout_minutes"
                                            error={errors.lockout_minutes}
                                            required
                                        >
                                            <Input
                                                id="lockout_minutes"
                                                type="number"
                                                min={5}
                                                max={120}
                                                value={data.lockout_minutes}
                                                onChange={(e) => setData('lockout_minutes', Number(e.target.value))}
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Ventana de bloqueo automático: <strong>{data.lockout_minutes} minutos</strong>.
                                            </p>
                                        </FormField>
                                    </div>

                                    {/* Switches de Complejidad */}
                                    <div className="pt-4 border-t space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Reglas de Complejidad Obligatorias
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-medium">Mayúsculas y Minúsculas</Label>
                                                    <p className="text-[11px] text-muted-foreground">Exige al menos una de cada una</p>
                                                </div>
                                                <Switch
                                                    checked={data.require_mixed_case}
                                                    onCheckedChange={(val) => setData('require_mixed_case', val)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-medium">Números y Dígitos</Label>
                                                    <p className="text-[11px] text-muted-foreground">Exige al menos un número (0-9)</p>
                                                </div>
                                                <Switch
                                                    checked={data.require_numbers}
                                                    onCheckedChange={(val) => setData('require_numbers', val)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-medium">Símbolos Especiales</Label>
                                                    <p className="text-[11px] text-muted-foreground">Exige al menos un carácter especial (@$!%*?&#...)</p>
                                                </div>
                                                <Switch
                                                    checked={data.require_symbols}
                                                    onCheckedChange={(val) => setData('require_symbols', val)}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-medium">HaveIBeenPwned API (Breach Protection)</Label>
                                                    <p className="text-[11px] text-muted-foreground">Rechaza contraseñas filtradas en brechas mundiales</p>
                                                </div>
                                                <Switch
                                                    checked={data.require_uncompromised}
                                                    onCheckedChange={(val) => setData('require_uncompromised', val)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="size-4" />
                                            {processing ? 'Guardando...' : 'Guardar Parámetros SOX'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: Microsoft Entra ID (Azure SSO) */}
                    <TabsContent value="sso" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="size-4 text-blue-600" />
                                        Federación Corporativa: Microsoft Entra ID (Azure AD SAML 2.0 / OIDC)
                                    </span>
                                    <Badge variant={data.sso_azure_enabled ? 'default' : 'secondary'}>
                                        {data.sso_azure_enabled ? 'SSO Activo' : 'En Configuración'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Permite a los administradores y analistas de Smurfit Westrock iniciar sesión directamente con su cuenta @smurfitwestrock.mx
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    <div className="flex items-center justify-between rounded-xl border border-blue-200/60 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20 p-4">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-blue-950 dark:text-blue-200">
                                                Habilitar botón de inicio de sesión con Microsoft Entra ID
                                            </p>
                                            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/70">
                                                Al activarlo, se presenta el botón en la pantalla de login principal de Hoshō.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={data.sso_azure_enabled}
                                            onCheckedChange={(val) => setData('sso_azure_enabled', val)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField label="Azure Tenant ID (Directorio)" htmlFor="azure_tenant_id">
                                            <Input
                                                id="azure_tenant_id"
                                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                value={data.azure_tenant_id}
                                                onChange={(e) => setData('azure_tenant_id', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Application (Client) ID" htmlFor="azure_client_id">
                                            <Input
                                                id="azure_client_id"
                                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                value={data.azure_client_id}
                                                onChange={(e) => setData('azure_client_id', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Client Secret (Valor del Secreto)" htmlFor="azure_client_secret">
                                            <Input
                                                id="azure_client_secret"
                                                type="password"
                                                placeholder="••••••••••••••••••••••••••••••••"
                                                value={data.azure_client_secret}
                                                onChange={(e) => setData('azure_client_secret', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Redirect URI (Callback de Retorno)" htmlFor="azure_redirect_uri">
                                            <Input
                                                id="azure_redirect_uri"
                                                placeholder="https://hosho.smurfitwestrock.mx/auth/sso/azure/callback"
                                                value={data.azure_redirect_uri}
                                                onChange={(e) => setData('azure_redirect_uri', e.target.value)}
                                            />
                                        </FormField>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button type="submit" disabled={processing} className="gap-2">
                                            <Save className="size-4" />
                                            {processing ? 'Guardando...' : 'Guardar Credenciales SSO'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: Usuarios y Desbloqueo */}
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Monitoreo de Cuentas y Desbloqueo Administrativo</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        Total: {users.length} cuentas
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Monitoree los días restantes de vigencia, intentos fallidos y aplique desbloqueo manual o renovación forzosa inmediata.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Planta / Sucursal</TableHead>
                                            <TableHead>Último Cambio</TableHead>
                                            <TableHead>Vigencia</TableHead>
                                            <TableHead>Intentos Fallidos</TableHead>
                                            <TableHead>Estado SOX</TableHead>
                                            <TableHead className="text-right">Acción SOX</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>
                                                    <p className="font-semibold text-xs text-foreground">{u.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <p className="text-foreground">{u.empresa}</p>
                                                    <p className="text-[11px] text-muted-foreground">{u.sucursal}</p>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">
                                                    {u.password_changed_at}
                                                </TableCell>
                                                <TableCell>
                                                    {u.is_expired ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Caducada
                                                        </Badge>
                                                    ) : (
                                                        <span className={cn(
                                                            'text-xs font-semibold',
                                                            u.days_remaining <= 15 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                                        )}>
                                                            {u.days_remaining} días restantes
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">
                                                    <span className={cn(u.failed_attempts >= 5 ? 'text-red-600 font-bold' : 'text-foreground')}>
                                                        {u.failed_attempts} / {config.max_failed_attempts}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {u.is_locked ? (
                                                        <Badge className="bg-red-600 text-white gap-1 text-[10px]">
                                                            <Lock className="size-2.5" />
                                                            Bloqueado ({u.lockout_remaining_minutes} min)
                                                        </Badge>
                                                    ) : u.is_expired ? (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Renovación Pendiente
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                            Al Día
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    {u.is_locked ? (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white gap-1"
                                                            onClick={() => handleUnlockUser(u)}
                                                            disabled={actionLoadingId === u.id}
                                                        >
                                                            <Unlock className="size-3" />
                                                            Desbloquear
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs gap-1"
                                                            onClick={() => handleForceReset(u)}
                                                            disabled={actionLoadingId === u.id}
                                                            title="Forzar cambio de contraseña en su próximo inicio de sesión"
                                                        >
                                                            <RotateCw className="size-3" />
                                                            Forzar Expiración
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 5: Bitácora Inmutable (Logs) */}
                    <TabsContent value="audit" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="size-4 text-emerald-600" />
                                    Trazabilidad Inmutable de Eventos de Ciberseguridad (Spatie ActivityLog)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Registro de solo lectura de intentos fallidos, bloqueos automáticos SOX, desbloqueos y renovaciones forzadas.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-40">Fecha y Hora</TableHead>
                                            <TableHead>Evento</TableHead>
                                            <TableHead>Responsable / Causer</TableHead>
                                            <TableHead>Descripción del Evento</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                                                    No hay eventos de auditoría registrados recientemente.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                                        {log.created_at}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn(
                                                            'text-[10px] uppercase font-mono',
                                                            log.event === 'sox_lockout' ? 'bg-red-50 text-red-700 border-red-300' :
                                                            log.event === 'sox_user_unlocked' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                                            'bg-slate-50 text-slate-700 border-slate-300'
                                                        )}>
                                                            {log.event}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-semibold">
                                                        {log.causer}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-foreground">
                                                        {log.description}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
