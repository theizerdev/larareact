import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <img
                        src="/image/logo/hosho/lockup.png"
                        alt="Hoshō"
                        className="h-40 w-auto object-contain"
                    />
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
