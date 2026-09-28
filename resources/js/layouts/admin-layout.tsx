import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { TemplateSettingsProvider } from '@/hooks/use-template-settings';
import AdminSaasLayout from '@/layouts/admin/admin-saas-layout';
import type { BreadcrumbItem } from '@/types';
import { notifyError, notifyInfo, notifySuccess, notifyWarning } from '@/utils/notifications';

export default function AdminLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { props } = usePage();
    const { notification } = props as unknown as {
        notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string };
    };

    useEffect(() => {
        if (notification) {
            switch (notification.type) {
                case 'success':
                    notifySuccess(notification.message);
                    break;
                case 'error':
                    notifyError(notification.message);
                    break;
                // Se guardó, pero hay algo que conviene mirar: la incidencia
                // cae en días con marcajes, por ejemplo.
                case 'warning':
                    notifyWarning(notification.message);
                    break;
                case 'info':
                    notifyInfo(notification.message);
                    break;
            }
        }
    }, [notification]);

    return (
        <TemplateSettingsProvider>
            <AdminSaasLayout breadcrumbs={breadcrumbs}>{children}</AdminSaasLayout>
        </TemplateSettingsProvider>
    );
}