import { 
    Settings, 
    RotateCcw, 
    Sun, 
    Moon, 
    Monitor, 
    Check, 
    Paintbrush,
    Layout,
    Columns,
    Compass
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

export default function TemplateCustomizer() {
    const { __ } = useTranslate();
    const [isOpen, setIsOpen] = useState(false);
    const colorPickerRef = useRef<HTMLInputElement>(null);

    const {
        settings,
        appearance,
        updateAppearance,
        updateSetting
    } = useTemplateSettings();

    // Reset settings to default values
    const handleReset = () => {
        updateSetting('primaryColor', 'indigo');
        updateSetting('skin', 'default');
        updateSetting('semiDark', false);
        updateSetting('collapsed', false);
        updateSetting('navbarType', 'sticky');
        updateSetting('contentWidth', 'wide');
        updateSetting('direction', 'ltr');
        updateAppearance('system');
    };

    const presetColors = [
        { name: 'indigo', hex: '#6366f1', label: __('Indigo') },
        { name: 'teal', hex: '#0d9488', label: __('Teal') },
        { name: 'orange', hex: '#ea580c', label: __('Orange') },
        { name: 'pink', hex: '#db2777', label: __('Pink') },
        { name: 'blue', hex: '#2563eb', label: __('Blue') },
    ];

    const currentPrimaryIsPreset = presetColors.some(c => c.name === settings.primaryColor);

    return (
        <>
            {/* Floating Settings Button with Spinning Hover animation */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex h-10 w-10 items-center justify-center rounded-l-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border-l border-t border-b border-indigo-400/20 focus:outline-none cursor-pointer transition-all hover:pr-1 group"
                title={__('Customize Template')}
            >
                <Settings className="size-5 animate-[spin_8s_linear_infinite] group-hover:scale-110 transition-transform" />
            </button>

            {/* Template Customizer Side Panel */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-[380px] sm:w-[400px] overflow-y-auto p-6 scrollbar-thin">
                    <SheetHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {__('Template Customizer')}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-1">
                                    {__('Customize and preview in real time')}
                                </SheetDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReset}
                                className="h-8 w-8 text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                                title={__('Reset to Defaults')}
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        {/* ================= THEME OPTIONS ================= */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400">
                                    {__('Theming')}
                                </span>
                            </div>

                            {/* Primary Color Picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Primary Color')}
                                </label>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {presetColors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => updateSetting('primaryColor', color.name)}
                                            style={{ backgroundColor: color.hex }}
                                            className={cn(
                                                "relative h-7 w-7 rounded-md cursor-pointer transition-all border border-black/10 dark:border-white/10 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm",
                                                settings.primaryColor === color.name && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-905"
                                            )}
                                            title={color.label}
                                        >
                                            {settings.primaryColor === color.name && (
                                                <Check className="size-4 text-white" />
                                            )}
                                        </button>
                                    ))}

                                    {/* Custom Color Selector */}
                                    <button
                                        onClick={() => colorPickerRef.current?.click()}
                                        className={cn(
                                            "relative h-7 w-7 rounded-md cursor-pointer transition-all border border-dashed border-muted-foreground hover:scale-105 flex items-center justify-center shadow-sm bg-slate-50 dark:bg-slate-900 hover:bg-slate-100",
                                            !currentPrimaryIsPreset && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-905 border-solid"
                                        )}
                                        style={{
                                            backgroundColor: !currentPrimaryIsPreset ? settings.primaryColor : undefined
                                        }}
                                        title={__('Custom Color')}
                                    >
                                        {!currentPrimaryIsPreset ? (
                                            <Check className="size-4" style={{ color: getContrastColor(settings.primaryColor) }} />
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
                                </div>
                            </div>

                            {/* Theme switcher */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Theme')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['light', 'dark', 'system'] as const).map((mode) => {
                                        const isActive = appearance === mode;

                                        return (
                                            <button
                                                key={mode}
                                                onClick={() => updateAppearance(mode)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-lg border bg-card hover:bg-accent text-card-foreground text-xs font-medium cursor-pointer transition-all gap-1.5",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {mode === 'light' && <Sun className="size-4" />}
                                                {mode === 'dark' && <Moon className="size-4" />}
                                                {mode === 'system' && <Monitor className="size-4" />}
                                                <span className="capitalize">{__(mode)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Skins (Default / Bordered) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Skins')}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['default', 'bordered'] as const).map((skinOpt) => {
                                        const isActive = settings.skin === skinOpt;

                                        return (
                                            <button
                                                key={skinOpt}
                                                onClick={() => updateSetting('skin', skinOpt)}
                                                className={cn(
                                                    "flex flex-col p-2.5 rounded-lg border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {/* Mini skin preview */}
                                                <div className={cn(
                                                    "flex h-12 w-full gap-1 rounded p-1 bg-slate-100 dark:bg-slate-900 border",
                                                    skinOpt === 'bordered' ? "border-slate-300 dark:border-slate-800" : "border-transparent"
                                                )}>
                                                    <div className="w-1/4 rounded bg-slate-300 dark:bg-slate-800 shrink-0"></div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="h-2 rounded bg-slate-300 dark:bg-slate-800 w-full"></div>
                                                        <div className="flex-1 rounded border border-dashed border-slate-300 dark:border-slate-800 w-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold capitalize">{__(skinOpt)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Semi-Dark Sidebar Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-card border-border">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {__('Semi Dark')}
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">
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

                        <hr className="border-border" />

                        {/* ================= LAYOUT OPTIONS ================= */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400">
                                    {__('Layout')}
                                </span>
                            </div>

                            {/* Navigation expanded vs collapsed */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Menu (Navigation)')}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: false, label: __('Expanded') },
                                        { key: true, label: __('Collapsed') }
                                    ].map((opt) => {
                                        const isActive = settings.collapsed === opt.key;

                                        return (
                                            <button
                                                key={String(opt.key)}
                                                onClick={() => updateSetting('collapsed', opt.key)}
                                                className={cn(
                                                    "flex flex-col p-2.5 rounded-lg border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {/* Expanded / Collapsed miniature */}
                                                <div className="flex h-12 w-full gap-1 rounded p-1 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                                    <div className={cn(
                                                        "rounded bg-slate-400 dark:bg-slate-800 transition-all shrink-0",
                                                        opt.key ? "w-2.5" : "w-1/4"
                                                    )}></div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="h-2 rounded bg-slate-300 dark:bg-slate-800 w-full"></div>
                                                        <div className="flex-1 rounded bg-slate-200 dark:bg-slate-800 w-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Navbar Type: Sticky / Static / Hidden */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Navbar Type')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['sticky', 'static', 'hidden'] as const).map((type) => {
                                        const isActive = settings.navbarType === type;

                                        return (
                                            <button
                                                key={type}
                                                onClick={() => updateSetting('navbarType', type)}
                                                className={cn(
                                                    "flex flex-col p-2.5 rounded-lg border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {/* Navbar Type miniature */}
                                                <div className="flex h-12 w-full gap-1 rounded p-1 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                                    <div className="w-2.5 rounded bg-slate-300 dark:bg-slate-800 shrink-0"></div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        {type !== 'hidden' && (
                                                            <div className={cn(
                                                                "h-2 rounded w-full border",
                                                                type === 'sticky' ? "bg-indigo-500/20 border-indigo-500/30" : "bg-slate-300 dark:bg-slate-800 border-transparent"
                                                            )}></div>
                                                        )}
                                                        <div className="flex-1 rounded bg-slate-200 dark:bg-slate-850 w-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold capitalize">{__(type)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Width: Compact / Wide */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Content')}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['compact', 'wide'] as const).map((widthOpt) => {
                                        const isActive = settings.contentWidth === widthOpt;

                                        return (
                                            <button
                                                key={widthOpt}
                                                onClick={() => updateSetting('contentWidth', widthOpt)}
                                                className={cn(
                                                    "flex flex-col p-2.5 rounded-lg border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {/* Content Width miniature */}
                                                <div className="flex h-12 w-full gap-1 rounded p-1 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10 justify-center">
                                                    <div className={cn(
                                                        "h-full rounded bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-800 transition-all",
                                                        widthOpt === 'compact' ? "w-2/3" : "w-full"
                                                    )}></div>
                                                </div>
                                                <span className="text-xs font-semibold capitalize">{__(widthOpt)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Direction LTR vs RTL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Direction')}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['ltr', 'rtl'] as const).map((dir) => {
                                        const isActive = settings.direction === dir;

                                        return (
                                            <button
                                                key={dir}
                                                onClick={() => updateSetting('direction', dir)}
                                                className={cn(
                                                    "flex flex-col p-2.5 rounded-lg border bg-card hover:bg-accent text-left cursor-pointer transition-all gap-2",
                                                    isActive ? "border-indigo-600 ring-1 ring-indigo-500/20" : "border-border"
                                                )}
                                            >
                                                {/* Direction miniature */}
                                                <div className="flex h-12 w-full gap-1 rounded p-1 bg-slate-100 dark:bg-slate-900 border border-muted-foreground/10">
                                                    <div className={cn(
                                                        "w-1/4 rounded bg-slate-300 dark:bg-slate-800 shrink-0",
                                                        dir === 'rtl' ? 'order-last' : 'order-first'
                                                    )}></div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="h-2 rounded bg-slate-200 dark:bg-slate-800 w-3/4"></div>
                                                        <div className="flex-1 rounded bg-slate-100 dark:bg-slate-850 w-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold">
                                                    {dir === 'ltr' ? __('Left to Right (En)') : __('Right to Left (Ar)')}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

// Helper to determine text contrast for hex colors
function getContrastColor(hex: string): string {
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
