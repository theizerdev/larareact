import { Head, router } from '@inertiajs/react';
import { Building2, EyeOff, Info, Lock, Save, UserCog } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ADMIN_MENU_GROUPS, ADMIN_MENU_NODES, adminMenuChildren, type AdminMenuNode } from '@/config/admin-menu';
import { useTranslate } from '@/hooks/use-translate';

type HiddenMap = Record<string, boolean>;

interface PageProps {
    empresas: { id: number; nombre: string }[];
    roles: { id: number; name: string }[];
    /** empresa id => mapa con SOLO las claves ocultas. Ausencia = visible. */
    empresaHidden: Record<string, HiddenMap> | HiddenMap[];
    roleHidden: Record<string, HiddenMap> | HiddenMap[];
    /** role id => permisos que tiene el rol */
    rolePermissions: Record<string, string[]>;
}

interface EditorProps {
    hidden: HiddenMap;
    saving: boolean;
    onSave: (hiddenKeys: string[]) => void;
    /** Permisos del rol que se edita; ausente en la pestaña de empresa (depende del rol de cada usuario). */
    permissions?: string[];
}

type Blocker = 'platform' | 'permission' | null;

/** Interruptores de grupos y subítems. Estado local: true = visible. */
function VisibilityEditor({ hidden, saving, onSave, permissions }: EditorProps) {
    const { __ } = useTranslate();

    // Un interruptor encendido NO garantiza que el ítem se vea: el layout también exige
    // permiso y los módulos de plataforma son solo del Super Administrador. Se avisa aquí.
    const blockerOf = (node: AdminMenuNode): Blocker => {
        if (node.platformOnly) {
            return 'platform';
        }

        if (permissions && node.permissions && !node.permissions.some((p) => permissions.includes(p))) {
            return 'permission';
        }

        return null;
    };
    const blockerLabel = (b: Blocker) =>
        b === 'platform'
            ? __('Super Administrator only: never shown to company users')
            : b === 'permission'
              ? __('This role lacks the permission, so it will not be shown')
              : '';
    const groupBlocker = (group: AdminMenuNode): Blocker => {
        if (group.platformOnly) {
            return 'platform';
        }

        const kids = adminMenuChildren(group.key);

        return kids.length > 0 && kids.every((k) => blockerOf(k)) ? 'permission' : null;
    };

    const initial = useMemo(() => {
        const state: Record<string, boolean> = {};

        for (const node of ADMIN_MENU_NODES) {
            state[node.key] = hidden[node.key] !== false;
        }

        return state;
    }, [hidden]);

    const [state, setState] = useState(initial);

    useEffect(() => setState(initial), [initial]);

    const dirty = Object.keys(state).some((k) => state[k] !== initial[k]);

    const toggleGroup = (groupKey: string, value: boolean) => {
        setState((prev) => {
            const next = { ...prev, [groupKey]: value };

            // Al apagar/encender el grupo, arrastra a sus hijos por comodidad.
            for (const child of adminMenuChildren(groupKey)) {
                next[child.key] = value;
            }

            return next;
        });
    };

    const handleSave = () =>
        onSave(Object.keys(state).filter((k) => state[k] === false));

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!dirty || saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {__('Save Changes')}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {ADMIN_MENU_GROUPS.map((group) => {
                    const children = adminMenuChildren(group.key);
                    const groupOn = state[group.key];
                    const gBlock = groupBlocker(group);

                    return (
                        <Card key={group.key} className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{__(group.labelKey)}</CardTitle>
                                    <Switch
                                        checked={groupOn && !gBlock}
                                        disabled={!!gBlock}
                                        onCheckedChange={(v) => toggleGroup(group.key, v)}
                                    />
                                </div>
                                {gBlock && (
                                    <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                                        <Lock className="h-3 w-3 shrink-0" />
                                        {blockerLabel(gBlock)}
                                    </p>
                                )}
                            </CardHeader>
                            {children.length > 0 && (
                                <CardContent className="space-y-2 pt-0">
                                    {children.map((child) => {
                                        const block = gBlock ? null : blockerOf(child);

                                        return (
                                        <div
                                            key={child.key}
                                            title={blockerLabel(block)}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 bg-slate-50 dark:bg-slate-900/40"
                                        >
                                            <Label className={`text-sm font-normal ${!groupOn || gBlock ? 'opacity-40' : ''}`}>
                                                {__(child.labelKey)}
                                                {block && <Lock className="ml-2 inline h-3 w-3 text-amber-600" />}
                                            </Label>
                                            <Switch
                                                checked={state[child.key] && groupOn && !gBlock && !block}
                                                disabled={!groupOn || !!gBlock || !!block}
                                                onCheckedChange={(v) =>
                                                    setState((prev) => ({ ...prev, [child.key]: v }))
                                                }
                                            />
                                        </div>
                                        );
                                    })}
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default function MenuVisibilidad({ empresas, roles, empresaHidden, roleHidden, rolePermissions }: PageProps) {
    const { __ } = useTranslate();

    const [empresaId, setEmpresaId] = useState<string>(empresas[0] ? String(empresas[0].id) : '');
    const [roleId, setRoleId] = useState<string>(roles[0] ? String(roles[0].id) : '');
    const [saving, setSaving] = useState(false);

    // PHP serializa un mapa vacío como [] — se normaliza a objeto.
    const hiddenOf = (all: PageProps['empresaHidden'], id: string): HiddenMap => {
        const v = (all as Record<string, HiddenMap>)[id];

        return v && !Array.isArray(v) ? v : {};
    };

    const save = (url: string, hiddenKeys: string[]) => {
        setSaving(true);
        router.put(
            url,
            { hidden: hiddenKeys },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        title: __('Settings Saved'),
                        text: __('Menu visibility updated.'),
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Security'), href: '#' },
        { title: __('Menu Visibility'), href: '/admin/seguridad/menu-visibilidad' },
    ];

    return (
        <>
            <Head title={__('Menu Visibility')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <EyeOff className="h-8 w-8 text-indigo-600" />
                        {__('Menu Visibility')}
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-3xl">
                        {__('Two levels decide what each user sees in the menu: first what the company has contracted, then what each role can see within that. This is visual only: it does not change permissions or direct URL access.')}
                    </p>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{__('A module is shown only if the company has it AND the user\'s role allows it. Super Administrators always see everything.')}</span>
                </div>

                <Tabs defaultValue="empresa" className="space-y-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="empresa" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            {__('By company')}
                        </TabsTrigger>
                        <TabsTrigger value="rol" className="gap-2">
                            <UserCog className="h-4 w-4" />
                            {__('By role')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="empresa" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {__('What this company contracted. What you turn off here disappears for all its users, whatever their role.')}
                        </p>
                        <div className="max-w-sm space-y-1.5">
                            <Label>{__('Company')}</Label>
                            <Select value={empresaId} onValueChange={setEmpresaId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={__('Select a company')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {empresas.map((e) => (
                                        <SelectItem key={e.id} value={String(e.id)}>
                                            {e.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {empresaId && (
                            <VisibilityEditor
                                key={`e-${empresaId}-${Object.keys(hiddenOf(empresaHidden, empresaId)).sort().join(',')}`}
                                hidden={hiddenOf(empresaHidden, empresaId)}
                                saving={saving}
                                onSave={(keys) => save(`/admin/seguridad/menu-visibilidad/empresa/${empresaId}`, keys)}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="rol" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {__('What each role can see within what its company has. The role applies in every company.')}
                        </p>
                        <div className="max-w-sm space-y-1.5">
                            <Label>{__('Role')}</Label>
                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={__('Select a role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {roleId && (
                            <VisibilityEditor
                                key={`r-${roleId}-${Object.keys(hiddenOf(roleHidden, roleId)).sort().join(',')}`}
                                hidden={hiddenOf(roleHidden, roleId)}
                                permissions={rolePermissions[roleId] ?? []}
                                saving={saving}
                                onSave={(keys) => save(`/admin/seguridad/menu-visibilidad/rol/${roleId}`, keys)}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
