import { router, usePage } from '@inertiajs/react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useTemplateSettings } from '@/hooks/use-template-settings';

export default function LanguageTabs({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { locale } = usePage().props as any;

    let updateSetting: any = null;
    try {
        const templateSettings = useTemplateSettings();
        updateSetting = templateSettings.updateSetting;
    } catch {
        // Outside provider
    }

    const tabs = [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' },
        { value: 'ar', label: 'العربية' },
    ];

    const changeLanguage = (lang: string) => {
        if (updateSetting) {
            updateSetting('direction', lang === 'ar' ? 'rtl' : 'ltr');
        }

        router.post(
            '/locale',
            { locale: lang },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            },
        );
    };

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => changeLanguage(value)}
                    className={cn(
                        'flex cursor-pointer items-center rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                        locale === value
                            ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                >
                    <span className="text-sm">{label}</span>
                </button>
            ))}
        </div>
    );
}
