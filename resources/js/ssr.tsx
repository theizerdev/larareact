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
            
            const path = `./pages/${name}.tsx`;
            const pathLower = path.toLowerCase();
            const matchingKey = Object.keys(pages).find((key) => key.toLowerCase() === pathLower);
            
            const pageComponent = matchingKey
                ? pages[matchingKey].default || pages[matchingKey]
                : pages[path].default || pages[path];
            
            // Apply layout resolver on SSR
            const nameLower = name.toLowerCase();
            if (!pageComponent.layout) {
                switch (true) {
                    case nameLower === 'welcome':
                    case nameLower === 'admin/integrations/navigation':
                    case nameLower === 'admin/integrations/map':
                        pageComponent.layout = null;
                        break;
                    case nameLower.startsWith('auth/'):
                        pageComponent.layout = (page: any) => <AuthLayout>{page}</AuthLayout>;
                        break;
                    case nameLower.startsWith('admin/'):
                    case nameLower === 'dashboard':
                    case nameLower.startsWith('settings/'):
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
