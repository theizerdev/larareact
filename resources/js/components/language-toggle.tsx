import { router, usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageToggle() {
    const { locale } = usePage().props as any;

    const changeLanguage = (lang: string) => {
        if (lang === locale) {
            return;
        }

        // Recarga completa tras guardar el idioma: traducciones y dirección (RTL/LTR)
        // cambian juntas en un solo clic, sin estados intermedios.
        router.post(
            '/locale',
            { locale: lang },
            {
                preserveScroll: true,
                onFinish: () => window.location.reload(),
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                >
                    <Globe className="h-[1.2rem] w-[1.2rem] opacity-80 hover:opacity-100" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                    onClick={() => changeLanguage('es')}
                    className="flex cursor-pointer items-center justify-between font-medium"
                >
                    <span>Español</span>
                    {locale === 'es' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className="flex cursor-pointer items-center justify-between font-medium"
                >
                    <span>English</span>
                    {locale === 'en' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('ar')}
                    className="flex cursor-pointer items-center justify-between font-medium"
                >
                    <span>العربية</span>
                    {locale === 'ar' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
