import { Head, usePage } from '@inertiajs/react';
import {
    RotateCcw,
    Sparkles,
    Sun,
    Moon,
    Monitor,
    LayoutTemplate,
    CheckCircle2,
} from 'lucide-react';
import React from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CountryFlagIcon } from '@/components/country-flag-icon';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import TemplateCustomizerContent, {
    PRESET_COLORS,
} from '@/components/template-customizer-content';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';
import { edit as editAppearance } from '@/routes/appearance';
import type { BreadcrumbItem } from '@/types';
import { notifySuccess } from '@/utils/notifications';

export default function Appearance() {
    const { __ } = useTranslate();
    const { settings, updateSetting, appearance, updateAppearance } = useTemplateSettings();
    const { locale } = usePage().props as any;
    const currentLocale = (locale === 'en' ? 'en' : 'es') as 'es' | 'en';

    const handleResetDefaults = () => {
        updateSetting('primaryColor', 'indigo');
        updateSetting('skin', 'default');
        updateSetting('semiDark', false);
        updateSetting('collapsed', false);
        updateSetting('navbarType', 'sticky');
        updateSetting('contentWidth', 'wide');
        updateSetting('direction', 'ltr');
        updateAppearance('system');
        notifySuccess(__('Configuración de apariencia restablecida a los valores predeterminados'));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: __('Configuración'),
            href: editAppearance(),
        },
        {
            title: __('Apariencia'),
            href: editAppearance(),
        },
    ];

    // Info activa para tarjetas KPI
    const currentThemeLabel =
        appearance === 'light'
            ? __('Modo Claro')
            : appearance === 'dark'
            ? __('Modo Oscuro')
            : __('Sistema');

    const activeColorObj = PRESET_COLORS.find((c) => c.name === settings.primaryColor);
    const activeColorHex = activeColorObj ? activeColorObj.hex : settings.primaryColor;
    const activeColorName = activeColorObj ? __(activeColorObj.label) : __('Personalizado');

    return (
        <>
            <Head title={__('Configuración de Apariencia')} />

            <div className="space-y-6 max-w-5xl mx-auto pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Banner Principal de Módulo con Degradado Oficial */}
                <ModuleHeader
                    icon={<Sparkles className="h-6 w-6 text-white" />}
                    title={__('Apariencia y Personalización')}
                    description={__(
                        'Personaliza el tema visual, selección de idioma con banderas regionales, esquema cromático y disposición de la interfaz.'
                    )}
                    colorClassName="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-md rounded-2xl"
                >
                    <Button
                        type="button"
                        onClick={handleResetDefaults}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs backdrop-blur-xs font-medium cursor-pointer"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {__('Restablecer')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas de Resumen KPI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <StatCard
                        icon={
                            appearance === 'dark' ? (
                                <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            ) : appearance === 'light' ? (
                                <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <Monitor className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            )
                        }
                        title={__('TEMA VISUAL')}
                        value={currentThemeLabel}
                        colorClassName={
                            appearance === 'dark'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40'
                                : appearance === 'light'
                                ? 'bg-amber-50 dark:bg-amber-950/40'
                                : 'bg-sky-50 dark:bg-sky-950/40'
                        }
                    />

                    <StatCard
                        icon={
                            <CountryFlagIcon
                                iso2={currentLocale === 'en' ? 'us' : 'es'}
                                className="text-2xl"
                            />
                        }
                        title={__('IDIOMA REGIONAL')}
                        value={currentLocale === 'en' ? 'English (US)' : 'Español (ES)'}
                        colorClassName="bg-slate-100 dark:bg-slate-800/80"
                    />

                    <StatCard
                        icon={
                            <div
                                className="h-5 w-5 rounded-full border border-black/10 dark:border-white/20 shadow-2xs"
                                style={{ backgroundColor: activeColorHex }}
                            />
                        }
                        title={__('COLOR DE ÉNFASIS')}
                        value={activeColorName}
                        colorClassName="bg-slate-100 dark:bg-slate-800/80"
                    />

                    <StatCard
                        icon={<LayoutTemplate className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                        title={__('DISPOSICIÓN')}
                        value={settings.contentWidth === 'wide' ? __('Fluido (Wide)') : __('Compacto')}
                        colorClassName="bg-purple-50 dark:bg-purple-950/40"
                    />
                </div>

                {/* 1. SECCIÓN: IDIOMA Y REGIÓN (FLAGICONS) */}
                <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <TemplateCustomizerContent
                        layoutMode="page"
                        showLanguage={true}
                        showTheming={false}
                        showLayout={false}
                    />
                </Card>

                {/* 2. SECCIÓN: TEMA VISUAL Y COLORES (THEMING) */}
                <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <TemplateCustomizerContent
                        layoutMode="page"
                        showLanguage={false}
                        showTheming={true}
                        showLayout={false}
                    />
                </Card>

                {/* 3. SECCIÓN: ESTRUCTURA Y DISPOSICIÓN (LAYOUT) */}
                <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <TemplateCustomizerContent
                        layoutMode="page"
                        showLanguage={false}
                        showTheming={false}
                        showLayout={true}
                    />
                </Card>

                {/* Pie Informativo de Sincronización */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                        {__(
                            'Tus cambios de apariencia se sincronizan automáticamente en tu perfil y se recuerdan en todos tus dispositivos y sesiones activas.'
                        )}
                    </span>
                </div>
            </div>
        </>
    );
}
