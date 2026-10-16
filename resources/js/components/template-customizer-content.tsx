import { router, usePage } from '@inertiajs/react';
import {
    Check,
    Sun,
    Moon,
    Monitor,
    Paintbrush,
    Languages,
    Palette,
    Layout,
} from 'lucide-react';
import React, { useRef } from 'react';
import { CountryFlagIcon } from '@/components/country-flag-icon';
import { Switch } from '@/components/ui/switch';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

// Helper to determine text contrast for hex colors
export function getContrastColor(hex: string): string {
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length !== 6) {
        return '#ffffff';
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

export const PRESET_COLORS = [
    { name: 'indigo', hex: '#6366f1', label: 'Indigo' },
    { name: 'teal', hex: '#0d9488', label: 'Teal' },
    { name: 'orange', hex: '#ea580c', label: 'Orange' },
    { name: 'pink', hex: '#db2777', label: 'Pink' },
    { name: 'blue', hex: '#2563eb', label: 'Blue' },
];

export interface TemplateCustomizerContentProps {
    layoutMode?: 'drawer' | 'page';
    showLanguage?: boolean;
    showTheming?: boolean;
    showLayout?: boolean;
    className?: string;
}

export default function TemplateCustomizerContent({
    layoutMode = 'drawer',
    showLanguage = true,
    showTheming = true,
    showLayout = true,
    className = '',
}: TemplateCustomizerContentProps) {
    const { __ } = useTranslate();
    const { locale } = usePage().props as any;
    const currentLocale = (locale === 'en' ? 'en' : 'es') as 'es' | 'en';
    const colorPickerRef = useRef<HTMLInputElement>(null);

    const {
        settings,
        appearance,
        updateAppearance,
        updateSetting,
    } = useTemplateSettings();

    const currentPrimaryIsPreset = PRESET_COLORS.some(
        (c) => c.name === settings.primaryColor
    );

    const changeLanguage = (lang: 'es' | 'en') => {
        if (lang === currentLocale) {
            return;
        }

        router.post(
            '/locale',
            { locale: lang },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            },
        );
    };

    const isPage = layoutMode === 'page';

    return (
        <div className={cn('space-y-8', className)}>
            {/* ================= 1. IDIOMA Y REGIÓN (FLAGICON) ================= */}
            {showLanguage && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center gap-1.5">
                            <Languages className="h-3.5 w-3.5" />
                            {__('Language & Region')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Select System Language')}
                        </label>
                        <div
                            className={cn(
                                'grid gap-3',
                                isPage ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'
                            )}
                        >
                            {[
                                {
                                    code: 'es' as const,
                                    label: 'Español',
                                    sublabel: 'Castellano (ES)',
                                    iso2: 'es',
                                },
                                {
                                    code: 'en' as const,
                                    label: 'English',
                                    sublabel: 'United States (US)',
                                    iso2: 'us',
                                },
                            ].map((lang) => {
                                const isActive = currentLocale === lang.code;

                                return (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => changeLanguage(lang.code)}
                                        className={cn(
                                            'group relative flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-3',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                                                : 'border-border hover:border-slate-300 dark:hover:border-slate-700'
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                                                <CountryFlagIcon
                                                    iso2={lang.iso2}
                                                    className="text-xl rounded-[2px] shadow-2xs"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                                        {lang.label}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-1 py-0.2 rounded bg-muted border">
                                                        {lang.code}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                    {lang.sublabel}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                                                isActive
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-700'
                                            )}
                                        >
                                            {isActive && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 2. THEMING (TEMAS Y COLORES) ================= */}
            {showTheming && (
                <div className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5" />
                            {__('Theming')}
                        </span>
                    </div>

                    {/* Primary Color Picker */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Primary Color')}
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => updateSetting('primaryColor', color.name)}
                                    style={{ backgroundColor: color.hex }}
                                    className={cn(
                                        'relative h-8 w-8 rounded-lg cursor-pointer transition-all border border-black/10 dark:border-white/10 hover:scale-105 active:scale-95 flex items-center justify-center shadow-xs',
                                        settings.primaryColor === color.name &&
                                            'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                                    )}
                                    title={__(color.label)}
                                >
                                    {settings.primaryColor === color.name && (
                                        <Check className="size-4 text-white stroke-[3]" />
                                    )}
                                </button>
                            ))}

                            {/* Custom Color Selector */}
                            <button
                                type="button"
                                onClick={() => colorPickerRef.current?.click()}
                                className={cn(
                                    'relative h-8 w-8 rounded-lg cursor-pointer transition-all border border-dashed border-muted-foreground hover:scale-105 flex items-center justify-center shadow-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100',
                                    !currentPrimaryIsPreset &&
                                        'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 border-solid'
                                )}
                                style={{
                                    backgroundColor: !currentPrimaryIsPreset
                                        ? settings.primaryColor
                                        : undefined,
                                }}
                                title={__('Custom Color')}
                            >
                                {!currentPrimaryIsPreset ? (
                                    <Check
                                        className="size-4 stroke-[3]"
                                        style={{ color: getContrastColor(settings.primaryColor) }}
                                    />
                                ) : (
                                    <Paintbrush className="size-3.5 text-muted-foreground" />
                                )}
                            </button>
                            <input
                                type="color"
                                ref={colorPickerRef}
                                value={!currentPrimaryIsPreset ? settings.primaryColor : '#6366f1'}
                                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                className="sr-only"
                            />

                            {!currentPrimaryIsPreset && (
                                <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-muted border text-muted-foreground">
                                    {settings.primaryColor}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Theme switcher */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Theme')}
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(['light', 'dark', 'system'] as const).map((mode) => {
                                const isActive = appearance === mode;

                                return (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => updateAppearance(mode)}
                                        className={cn(
                                            'flex flex-col items-center justify-center p-3 rounded-xl border bg-card hover:bg-accent text-card-foreground text-xs font-medium cursor-pointer transition-all gap-1.5',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {mode === 'light' && <Sun className="size-4.5 text-amber-500" />}
                                        {mode === 'dark' && <Moon className="size-4.5 text-indigo-400" />}
                                        {mode === 'system' && <Monitor className="size-4.5 text-sky-500" />}
                                        <span className="capitalize font-semibold">{__(mode)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Skins (Default / Bordered) con miniaturas wireframe oficiales */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Skins')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['default', 'bordered'] as const).map((skinOpt) => {
                                const isActive = settings.skin === skinOpt;

                                return (
                                    <button
                                        key={skinOpt}
                                        type="button"
                                        onClick={() => updateSetting('skin', skinOpt)}
                                        className={cn(
                                            'flex flex-col p-3 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2.5',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {/* Mini skin preview */}
                                        <div
                                            className={cn(
                                                'flex h-12 w-full gap-1.5 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900 border transition-colors',
                                                skinOpt === 'bordered'
                                                    ? 'border-slate-300 dark:border-slate-700'
                                                    : 'border-transparent'
                                            )}
                                        >
                                            <div className="w-1/4 rounded bg-slate-300 dark:bg-slate-800 shrink-0" />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="h-2 rounded bg-slate-300 dark:bg-slate-800 w-full" />
                                                <div className="flex-1 rounded border border-dashed border-slate-300 dark:border-slate-800 w-full" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold capitalize">
                                            {__(skinOpt)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Semi-Dark Sidebar Toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card border-border">
                        <div className="space-y-0.5 pr-3">
                            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {__('Semi Dark')}
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                                {__('Forced dark sidebar in light mode')}
                            </p>
                        </div>
                        <Switch
                            checked={settings.semiDark}
                            onCheckedChange={(checked) => updateSetting('semiDark', checked)}
                            disabled={appearance === 'dark'}
                        />
                    </div>
                </div>
            )}

            {/* ================= 3. LAYOUT OPTIONS (ESTRUCTURA DE INTERFAZ) ================= */}
            {showLayout && (
                <div className="space-y-5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center gap-1.5">
                            <Layout className="h-3.5 w-3.5" />
                            {__('Layout')}
                        </span>
                    </div>

                    {/* Navigation expanded vs collapsed con miniaturas wireframe oficiales */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Menu (Navigation)')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: false, label: __('Expanded') },
                                { key: true, label: __('Collapsed') },
                            ].map((opt) => {
                                const isActive = settings.collapsed === opt.key;

                                return (
                                    <button
                                        key={String(opt.key)}
                                        type="button"
                                        onClick={() => updateSetting('collapsed', opt.key)}
                                        className={cn(
                                            'flex flex-col p-3 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2.5',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {/* Expanded / Collapsed miniature */}
                                        <div className="flex h-12 w-full gap-1.5 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                            <div
                                                className={cn(
                                                    'rounded bg-slate-400 dark:bg-slate-700 transition-all shrink-0',
                                                    opt.key ? 'w-2.5' : 'w-1/4'
                                                )}
                                            />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="h-2 rounded bg-slate-300 dark:bg-slate-800 w-full" />
                                                <div className="flex-1 rounded bg-slate-200 dark:bg-slate-800 w-full" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navbar Type: Sticky / Static / Hidden con miniaturas wireframe oficiales */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Navbar Type')}
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(['sticky', 'static', 'hidden'] as const).map((type) => {
                                const isActive = settings.navbarType === type;

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => updateSetting('navbarType', type)}
                                        className={cn(
                                            'flex flex-col p-2.5 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {/* Navbar Type miniature */}
                                        <div className="flex h-12 w-full gap-1 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                            <div className="w-2.5 rounded bg-slate-300 dark:bg-slate-800 shrink-0" />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                {type !== 'hidden' && (
                                                    <div
                                                        className={cn(
                                                            'h-2 rounded w-full border',
                                                            type === 'sticky'
                                                                ? 'bg-indigo-500/30 border-indigo-500/40'
                                                                : 'bg-slate-300 dark:bg-slate-800 border-transparent'
                                                        )}
                                                    />
                                                )}
                                                <div className="flex-1 rounded bg-slate-200 dark:bg-slate-800 w-full" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold capitalize text-center w-full">
                                            {__(type)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Width: Compact / Wide con miniaturas wireframe oficiales */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Content')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['compact', 'wide'] as const).map((widthOpt) => {
                                const isActive = settings.contentWidth === widthOpt;

                                return (
                                    <button
                                        key={widthOpt}
                                        type="button"
                                        onClick={() => updateSetting('contentWidth', widthOpt)}
                                        className={cn(
                                            'flex flex-col p-3 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2.5',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {/* Content Width miniature */}
                                        <div className="flex h-12 w-full gap-1 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10 justify-center">
                                            <div
                                                className={cn(
                                                    'h-full rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 transition-all',
                                                    widthOpt === 'compact' ? 'w-2/3' : 'w-full'
                                                )}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold capitalize">
                                            {__(widthOpt)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Direction LTR vs RTL con miniaturas wireframe oficiales */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {__('Direction')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['ltr', 'rtl'] as const).map((dir) => {
                                const isActive = settings.direction === dir;

                                return (
                                    <button
                                        key={dir}
                                        type="button"
                                        onClick={() => updateSetting('direction', dir)}
                                        className={cn(
                                            'flex flex-col p-3 rounded-xl border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2.5',
                                            isActive
                                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                                                : 'border-border'
                                        )}
                                    >
                                        {/* Direction miniature */}
                                        <div className="flex h-12 w-full gap-1.5 rounded-lg p-1.5 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                            <div
                                                className={cn(
                                                    'w-1/4 rounded bg-slate-300 dark:bg-slate-800 shrink-0',
                                                    dir === 'rtl' ? 'order-last' : 'order-first'
                                                )}
                                            />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="h-2 rounded bg-slate-200 dark:bg-slate-800 w-3/4" />
                                                <div className="flex-1 rounded bg-slate-100 dark:bg-slate-800 w-full" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold">
                                            {dir === 'ltr'
                                                ? __('Left to Right (LTR)')
                                                : __('Right to Left (RTL)')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
