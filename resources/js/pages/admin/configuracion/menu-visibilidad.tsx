import { Head, router } from '@inertiajs/react';
import { EyeOff, Save, Info } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ADMIN_MENU_GROUPS, adminMenuChildren } from '@/config/admin-menu';
import { useTranslate } from '@/hooks/use-translate';

interface PageProps {
    /** Mapa con SOLO las claves ocultas (visible === false). Ausencia = visible. */
    visibility: Record<string, boolean>;
}

export default function MenuVisibilidad({ visibility }: PageProps) {
    const { __ } = useTranslate();

    // Estado local: true = visible. Arranca desde el mapa (ausencia = visible).
    const initial = useMemo(() => {
        const state: Record<string, boolean> = {};

        for (const group of ADMIN_MENU_GROUPS) {
            state[group.key] = visibility[group.key] !== false;

            for (const child of adminMenuChildren(group.key)) {
                state[child.key] = visibility[child.key] !== false;
            }
        }

        return state;
    }, [visibility]);

    const [state, setState] = useState<Record<string, boolean>>(initial);
    const [saving, setSaving] = useState(false);

    const dirty = useMemo(
        () => Object.keys(state).some((k) => state[k] !== initial[k]),
        [state, initial],
    );

    const setValue = (key: string, value: boolean) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

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

    const handleSave = () => {
        setSaving(true);
        router.put(
            '/admin/configuracion/menu-visibilidad',
            { visibility: state },
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
        { title: __('Settings'), href: '#' },
        { title: __('Menu Visibility'), href: '/admin/configuracion/menu-visibilidad' },
    ];

    return (
        <>
            <Head title={__('Menu Visibility')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <EyeOff className="h-8 w-8 text-indigo-600" />
                            {__('Menu Visibility')}
                        </h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl">
                            {__('Show or hide sidebar modules and submodules for everyone. This is visual only: it does not change permissions or direct URL access.')}
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={!dirty || saving} className="gap-2 shrink-0">
                        <Save className="h-4 w-4" />
                        {__('Save Changes')}
                    </Button>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{__('Hiding a module only removes it from the menu. The route stays protected by permissions as before.')}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {ADMIN_MENU_GROUPS.map((group) => {
                        const children = adminMenuChildren(group.key);
                        const groupOn = state[group.key];

                        return (
                            <Card key={group.key} className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{__(group.labelKey)}</CardTitle>
                                        <Switch
                                            checked={groupOn}
                                            onCheckedChange={(v) => toggleGroup(group.key, v)}
                                        />
                                    </div>
                                </CardHeader>
                                {children.length > 0 && (
                                    <CardContent className="space-y-2 pt-0">
                                        {children.map((child) => (
                                            <div
                                                key={child.key}
                                                className="flex items-center justify-between rounded-md border px-3 py-2 bg-slate-50 dark:bg-slate-900/40"
                                            >
                                                <Label
                                                    className={`text-sm font-normal ${!groupOn ? 'opacity-40' : ''}`}
                                                >
                                                    {__(child.labelKey)}
                                                </Label>
                                                <Switch
                                                    checked={state[child.key] && groupOn}
                                                    disabled={!groupOn}
                                                    onCheckedChange={(v) => setValue(child.key, v)}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
