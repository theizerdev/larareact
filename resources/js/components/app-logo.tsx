import { usePage } from '@inertiajs/react';
import ClientLogo from '@/components/client-logo';

export default function AppLogo() {
    const { auth } = usePage().props as any;
    const logoMini = auth?.user?.empresa?.logo_mini;
    const logo = auth?.user?.empresa?.logo;
    const companyLogo = logoMini || logo || "/image/logo/hosho/icon.png";
    const companyName = auth?.user?.empresa?.razon_social;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-transparent">
                <img
                    src={companyLogo}
                    alt={companyName || "Hoshō"}
                    className="size-8 object-contain"
                />
            </div>
            <span className="mx-2 h-6 w-px bg-border" />
            <ClientLogo
                className="h-7 max-w-28 w-auto object-contain"
                textClassName="truncate text-sm font-bold text-black dark:text-white"
            />
        </>
    );
}
