import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Configuración de apariencia" />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title="Apariencia"
                    description="Personaliza el tema visual de tu cuenta"
                />

                <SectionCard
                    title="Tema"
                    description="Selecciona el modo de color que prefieras"
                >
                    <AppearanceTabs />
                </SectionCard>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Configuración',
            href: editAppearance(),
        },
        {
            title: 'Apariencia',
            href: editAppearance(),
        },
    ],
};
