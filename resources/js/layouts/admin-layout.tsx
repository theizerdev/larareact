import AdminSaasLayout from '@/layouts/admin/admin-saas-layout';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { notifyError, notifySuccess } from '@/utils/notifications';
import { TemplateSettingsProvider } from '@/hooks/use-template-settings';

export default function AdminLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { props } = usePage();
    const { notification } = props as unknown as { notification: { type: 'success' | 'error'; message: string } };

    useEffect(() => {
        if (notification) {
            switch (notification.type) {
                case 'success':
                    notifySuccess(notification.message);
                    break;
                case 'error':
                    notifyError(notification.message);
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