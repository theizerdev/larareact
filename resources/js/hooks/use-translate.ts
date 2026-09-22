import { usePage } from '@inertiajs/react';

export function useTranslate() {
    const { props } = usePage();
    const translations = (props as any).translations || {};
    const locale = (props as any).locale || (typeof document !== 'undefined' ? document.documentElement.lang : 'es') || 'es';
    const isRtl = locale === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');

    const __ = (key: string, replace: Record<string, string> = {}) => {
        let translation =
            translations[key] !== undefined ? translations[key] : key;

        Object.keys(replace).forEach((rKey) => {
            translation = translation.replace(`:${rKey}`, replace[rKey]);
        });

        return translation;
    };

    return { __, currentLocale: locale, locale, isRtl };
}
