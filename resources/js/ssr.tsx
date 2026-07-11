import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

import AdminLayout from '@/layouts/admin-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import { TooltipProvider } from '@/components/ui/tooltip';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => {
            const pages = import.meta.glob(
                ['./pages/**/*.tsx', '!./pages/**/Partials/**/*.tsx'],
                { eager: true }
            ) as Record<string, any>;
            const pageComponent = pages[`./pages/${name}.tsx`].default || pages[`./pages/${name}.tsx`];
            
            // Apply layout resolver on SSR
            if (!pageComponent.layout) {
                switch (true) {
                    case name === 'welcome':
                    case name === 'admin/integrations/navigation':
                    case name === 'admin/integrations/map':
                        pageComponent.layout = null;
                        break;
                    case name.startsWith('auth/'):
                        pageComponent.layout = (page: any) => <AuthLayout>{page}</AuthLayout>;
                        break;
                    case name.startsWith('admin/'):
                    case name === 'dashboard':
                    case name.startsWith('settings/'):
                        pageComponent.layout = (page: any) => <AdminLayout>{page}</AdminLayout>;
                        break;
                    default:
                        pageComponent.layout = (page: any) => <AppLayout>{page}</AppLayout>;
                        break;
                }
            }
            return pageComponent;
        },
        setup: ({ App, props }) => {
            return (
                <TooltipProvider delayDuration={0}>
                    <App {...props} />
                </TooltipProvider>
            );
        },
    })
);
