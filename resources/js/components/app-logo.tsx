import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { auth } = usePage().props as any;
    const logoMini = auth?.user?.empresa?.logo_mini;
    const logo = auth?.user?.empresa?.logo;
    const companyLogo = logoMini || logo || "/image/logo/larareact_icon.png";
    const companyName = auth?.user?.empresa?.razon_social;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-transparent">
                {companyLogo && !companyLogo.includes('larareact_icon') ? (
                    <img
                        src={companyLogo}
                        alt={companyName || "Fix Sale"}
                        className="size-8 object-contain"
                    />
                ) : (
                    <div className="size-8 rounded-lg bg-[#0B2545] flex items-center justify-center font-extrabold text-white text-xs border border-blue-400/30">
                        F<span className="text-cyan-400">X</span>
                    </div>
                )}
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
