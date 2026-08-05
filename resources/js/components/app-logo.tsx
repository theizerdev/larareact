import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { auth } = usePage().props as any;
    const logoMini = auth?.user?.empresa?.logo_mini;
    const logo = auth?.user?.empresa?.logo;
    const companyLogo = logoMini || logo || "/image/logo/2.png";
    const companyName = auth?.user?.empresa?.razon_social;

    return (
        <>
            <div className="flex shrink-0 items-center justify-center bg-transparent">
                <img
                    src={companyLogo}
                    alt={companyName || "Fix Sale"}
                    className="size-8 object-contain [[data-sidebar=dark]_&]:brightness-0 [[data-sidebar=dark]_&]:invert dark:brightness-0 dark:invert"
                />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-foreground">
                    {companyName ? (
                        companyName
                    ) : (
                        <div className="flex flex-col">
                            <span className="font-extrabold tracking-wide text-xs text-slate-900 dark:text-white uppercase flex items-center gap-1">
                                FIX <span className="text-cyan-500 font-black">+</span> SALE
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">
                                Ventas & Servicios
                            </span>
                        </div>
                    )}
                </span>
            </div>
        </>
    );
}
