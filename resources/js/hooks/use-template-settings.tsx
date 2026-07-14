import { usePage, router } from '@inertiajs/react';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Appearance } from './use-appearance';
import { useAppearance } from './use-appearance';

export interface TemplateSettings {
    primaryColor: string;
    skin: 'default' | 'bordered';
    semiDark: boolean;
    collapsed: boolean;
    navbarType: 'sticky' | 'static' | 'hidden';
    contentWidth: 'compact' | 'wide';
    direction: 'ltr' | 'rtl';
}

const DEFAULT_SETTINGS: TemplateSettings = {
    primaryColor: 'indigo',
    skin: 'default',
    semiDark: false,
    collapsed: false,
    navbarType: 'sticky',
    contentWidth: 'wide',
    direction: 'ltr',
};

interface TemplateSettingsContextType {
    settings: TemplateSettings;
    appearance: Appearance;
    resolvedAppearance: 'light' | 'dark';
    updateAppearance: (mode: Appearance) => void;
    updateSetting: <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => void;
}

const TemplateSettingsContext = createContext<TemplateSettingsContextType | undefined>(undefined);

// Helper to determine text contrast (light or dark text) for dynamic hex colors
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

export function TemplateSettingsProvider({ children }: { children: React.ReactNode }) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const page = usePage();
    const user = (page.props.auth as any)?.user;
    const dbSettings = user?.layout_settings;
    const userId = user?.id;

    const [settings, setSettings] = useState<TemplateSettings>(() => {
        if (dbSettings) {
            return { ...DEFAULT_SETTINGS, ...dbSettings };
        }

        if (typeof window === 'undefined') {
return DEFAULT_SETTINGS;
}

        try {
            const stored = localStorage.getItem('template-settings');

            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Error loading template settings', e);
        }

        return DEFAULT_SETTINGS;
    });

    const updateSetting = <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => {
        setSettings((prev) => {
            const updated = { ...prev, [key]: value };
            localStorage.setItem('template-settings', JSON.stringify(updated));

            return updated;
        });
    };

    // Sync settings state ONLY if user changes (e.g. login/logout)
    const prevUserId = useRef(userId);
    useEffect(() => {
        if (userId !== prevUserId.current) {
            prevUserId.current = userId;

            if (dbSettings) {
                setSettings({ ...DEFAULT_SETTINGS, ...dbSettings });
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        }
    }, [userId, dbSettings]);

    // Save changes to database (debounced and with progress indicators disabled)
    const isFirstRun = useRef(true);
    const lastSavedSettings = useRef<string>('');

    useEffect(() => {
        const currentStr = JSON.stringify(settings);

        if (isFirstRun.current) {
            isFirstRun.current = false;
            lastSavedSettings.current = currentStr;

            return;
        }

        // Avoid duplicate saves if settings haven't actually changed from last save
        if (currentStr === lastSavedSettings.current) {
            return;
        }

        const timer = setTimeout(() => {
            if (user) {
                lastSavedSettings.current = currentStr;
                router.put('/settings/layout', settings as any, {
                    preserveScroll: true,
                    preserveState: true,
                    showProgress: false, // Prevent the top Inertia loading bar
                    only: ['auth'], // Optimize: only reload auth state from backend
                });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [settings, user]);

    // Apply settings to document element
    useEffect(() => {
        const root = document.documentElement;

        // 1. Primary Color presets handling
        const presetColors: Record<string, string> = {
            indigo: 'oklch(0.585 0.233 277.117)',
            teal: 'oklch(0.644 0.135 162.962)',
            orange: 'oklch(0.705 0.213 47.608)',
            pink: 'oklch(0.627 0.265 303.9)',
            blue: 'oklch(0.6 0.118 184.704)',
        };

        if (settings.primaryColor in presetColors) {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            root.dataset.primary = settings.primaryColor;
        } else {
            // Dynamic hex color selection
            root.dataset.primary = 'custom';
            root.style.setProperty('--primary', settings.primaryColor);
            root.style.setProperty('--primary-foreground', getContrastColor(settings.primaryColor));
        }

        // 2. Skins (Default / Bordered)
        root.dataset.skin = settings.skin;

        // 3. Semi Dark sidebar toggler
        root.dataset.sidebar = settings.semiDark ? 'dark' : 'light';

        // 4. Navbar Type (Sticky / Static / Hidden)
        root.dataset.navbar = settings.navbarType;

        // 5. Content Width (Compact / Wide)
        root.dataset.contentWidth = settings.contentWidth;

        // 6. Direction (LTR / RTL)
        root.setAttribute('dir', settings.direction);

    }, [settings]);

    return (
        <TemplateSettingsContext.Provider value={{
            settings,
            appearance,
            resolvedAppearance,
            updateAppearance,
            updateSetting
        }}>
            {children}
        </TemplateSettingsContext.Provider>
    );
}

export function useTemplateSettings() {
    const context = useContext(TemplateSettingsContext);

    if (!context) {
        throw new Error('useTemplateSettings must be used within a TemplateSettingsProvider');
    }

    return context;
}
