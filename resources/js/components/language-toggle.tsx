import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { CountryFlagIcon } from '@/components/country-flag-icon';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LanguageOption {
    code: 'es' | 'en';
    label: string;
    sublabel: string;
    iso2: string;
}

const LANGUAGES: LanguageOption[] = [
    {
        code: 'es',
        label: 'Español',
        sublabel: 'Castellano',
        iso2: 'es',
    },
    {
        code: 'en',
        label: 'English',
        sublabel: 'US / International',
        iso2: 'us',
    },
];

export default function LanguageToggle() {
    const { locale } = usePage().props as any;
    const currentLocale = (locale === 'en' ? 'en' : 'es') as 'es' | 'en';
    const activeLang = LANGUAGES.find((l) => l.code === currentLocale) || LANGUAGES[0];

    const changeLanguage = (lang: 'es' | 'en') => {
        if (lang === currentLocale) {
            return;
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8.5 px-2.5 gap-1.5 cursor-pointer rounded-lg hover:bg-muted/80 text-foreground transition-all duration-150 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    title={`Idioma: ${activeLang.label}`}
                >
                    <CountryFlagIcon
                        iso2={activeLang.iso2}
                        className="text-base rounded-[2px] shadow-2xs"
                    />
                    <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground group-hover:text-foreground">
                        {activeLang.code}
                    </span>
                    <span className="sr-only">Cambiar idioma ({activeLang.label})</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-lg rounded-xl">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Seleccionar Idioma
                </div>
                {LANGUAGES.map((lang) => {
                    const isSelected = currentLocale === lang.code;

                    return (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={cn(
                                'flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
                                isSelected
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-foreground hover:bg-muted'
                            )}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-5 w-5 items-center justify-center shrink-0">
                                    <CountryFlagIcon
                                        iso2={lang.iso2}
                                        className="text-lg rounded-[2px] shadow-2xs"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium leading-none">
                                        {lang.label}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                                        {lang.sublabel}
                                    </span>
                                </div>
                            </div>
                            {isSelected && (
                                <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
