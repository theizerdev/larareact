import { Link, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-svh w-full lg:grid-cols-2">
            {/* Visual panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
                {/* Background Image with smooth zoom micro-animation */}
                <div
                    className="absolute inset-0 bg-cover transition-transform duration-[10000ms] ease-out hover:scale-110"
                    style={{
                        backgroundImage: 'url("/image/login_shigoto_bg.jpg")',
                        backgroundPosition: '30% center',
                    }}
                />
                {/* Subtle vignette overlay to keep logo and footer readable while showcasing the image */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />

                <Link
                    href={home()}
                    className="relative z-10 flex items-center font-semibold"
                >
                    <img
                        src="/image/logo/shigoto/lockup-dark.png"
                        alt="Shigoto"
                        className="h-9 w-auto object-contain"
                    />
                </Link>

                <p className="relative z-10 text-sm text-white/70 font-medium drop-shadow-sm">
                    © {new Date().getFullYear()} {name}. Todos los derechos
                    reservados.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex flex-col items-center justify-center bg-background p-6 sm:p-12">
                <div className="w-full max-w-sm">
                    <Link
                        href={home()}
                        className="mb-8 flex items-center justify-center"
                    >
                        <img
                            src="/image/logo/shigoto/lockup.png"
                            alt="Shigoto"
                            className="h-12 w-auto object-contain"
                        />
                    </Link>

                    <div className="mb-8 space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}

                    {/* Certificaciones y Normativas Internacionales */}
                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
                        <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                            Con apego y alineación a políticas y normativas internacionales
                        </p>
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                            <img src="/image/logo/certifications/iso20000.svg" alt="ISO 20000" className="h-11 sm:h-12 w-auto object-contain hover:scale-105 transition-transform shrink-0" />
                            <img src="/image/logo/certifications/ctpat.svg" alt="CTPAT" className="h-8 sm:h-9 w-auto object-contain hover:scale-105 transition-transform shrink-0" />
                            <img src="/image/logo/certifications/oea_mexico.svg" alt="OEA México" className="h-8 sm:h-9 w-auto object-contain hover:scale-105 transition-transform shrink-0" />
                            <img src="/image/logo/certifications/iso27001.svg" alt="ISO 27001" className="h-11 sm:h-12 w-auto object-contain hover:scale-105 transition-transform shrink-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}