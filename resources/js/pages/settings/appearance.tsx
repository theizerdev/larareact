import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import LanguageTabs from '@/components/language-tabs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { edit as editAppearance } from '@/routes/appearance';
import { useTranslate } from '@/hooks/use-translate';

export default function Appearance() {
    const { __ } = useTranslate();

    return (
        <>
            <Head title={__('Configuración de apariencia')} />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title={__('Appearance')}
                    description={__('Personaliza el tema visual de tu cuenta')}
                />

                <SectionCard
                    title={__('Tema')}
                    description={__(
                        'Selecciona el modo de color que prefieras',
                    )}
                >
                    <AppearanceTabs />
                </SectionCard>

                <SectionCard
                    title={__('Language')}
                    description={__('Select Language')}
                >
                    <LanguageTabs />
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
