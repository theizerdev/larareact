import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob(
            ['./pages/**/*.tsx', '!./pages/**/Partials/**/*.tsx'],
            { eager: true }
        ) as Record<string, any>;
        
        const path = `./pages/${name}.tsx`;
        const pathLower = path.toLowerCase();
        const matchingKey = Object.keys(pages).find((key) => key.toLowerCase() === pathLower);
        
        if (matchingKey) {
            return pages[matchingKey];
        }

        return pages[path];
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'Error':
            case name === 'admin/integrations/navigation':
            case name === 'admin/integrations/map':
            case name.startsWith('preregistro/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('admin/'):
            case name === 'dashboard':
            case name.startsWith('settings/'):
                return AdminLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();