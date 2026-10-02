import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <img
                                src="/image/logo/hosho/lockup.png"
                                alt="Hoshō"
                                className="h-40 w-auto object-contain"
                            />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}

                    {/* Certificaciones y Normativas Internacionales */}
                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
                        <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                            Con apego y alineación a políticas y normativas internacionales
                        </p>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                            <img src="/image/logo/certifications/iso20000.svg" alt="ISO 20000" className="h-10 w-auto object-contain shrink-0" />
                            <img src="/image/logo/certifications/ctpat.svg" alt="CTPAT" className="h-7 w-auto object-contain shrink-0" />
                            <img src="/image/logo/certifications/oea_mexico.svg" alt="OEA México" className="h-7 w-auto object-contain shrink-0" />
                            <img src="/image/logo/certifications/iso27001.svg" alt="ISO 27001" className="h-10 w-auto object-contain shrink-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
