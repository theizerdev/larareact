import AdminSaasLayout from '@/layouts/admin/admin-saas-layout';
import type { BreadcrumbItem } from '@/types';

export default function AdminLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AdminSaasLayout breadcrumbs={breadcrumbs}>{children}</AdminSaasLayout>
    );
}
