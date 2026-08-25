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
    resolve: async (name) => {
        const pages = import.meta.glob(
            ['./pages/**/*.tsx', '!./pages/**/Partials/**/*.tsx']
        );
        
        const path = `./pages/${name}.tsx`;
        if (pages[path]) {
            const page = await pages[path]();
            return (page as any).default || page;
        }

        const pathLower = path.toLowerCase();
        const matchingKey = Object.keys(pages).find((key) => key.toLowerCase() === pathLower);
        
        if (matchingKey) {
            const page = await pages[matchingKey]();
            return (page as any).default || page;
        }

        throw new Error(`Page not found: ${name}`);
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'Error':
            case name === 'admin/integrations/navigation':
            case name === 'admin/integrations/map':
            case name.startsWith('preregistro/'):
            case name.startsWith('preregistro-empleado/'):
            case name.startsWith('preregistro-visita/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('admin/'):
            case name.startsWith('superadmin/'):
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