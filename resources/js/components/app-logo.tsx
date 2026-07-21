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
                <img
                    src={companyLogo}
                    alt={companyName || "LaraReact Icon"}
                    className="size-8 object-contain"
                />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-black dark:text-white">
                    {companyName ? (
                        companyName
                    ) : (
                        <>
                            lara
                            <span className="bg-gradient-to-r from-[#FF2D20] to-[#00F2FE] bg-clip-text text-transparent">
                                react
                            </span>
                        </>
                    )}
                </span>
            </div>
        </>
    );
}
