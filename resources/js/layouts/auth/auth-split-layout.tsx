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
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white lg:flex">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-indigo-500/30 blur-3xl" />
                    <div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-3xl" />
                </div>

                <Link
                    href={home()}
                    className="relative z-10 flex items-center font-semibold"
                >
                    <img
                        src="/image/logo/larareact_logo_transparent.png"
                        alt="LaraReact Logo"
                        className="h-40 w-auto object-contain"
                    />
                </Link>

                <div className="relative z-10 max-w-md">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
                        <ShieldCheck className="size-4 text-emerald-400" />
                        <span>Seguro, rápido y confiable</span>
                    </div>
                    <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
                        La base perfecta para construir sistemas profesionales.
                    </h2>
                    <p className="mt-4 text-base text-balance text-white/70">
                        Diseño moderno, componentes reutilizables y una
                        experiencia de usuario refinada desde el primer día.
                    </p>
                </div>

                <p className="relative z-10 text-sm text-white/50">
                    © {new Date().getFullYear()} {name}. Todos los derechos
                    reservados.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex flex-col items-center justify-center bg-background p-6 sm:p-12">
                <div className="w-full max-w-sm">
                    <Link
                        href={home()}
                        className="mb-8 flex items-center justify-center lg:hidden"
                    >
                        <img
                            src="/image/logo/larareact_logo_transparent.png"
                            alt="LaraReact Logo"
                            className="h-20 w-auto object-contain"
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
                </div>
            </div>
        </div>
    );
}
