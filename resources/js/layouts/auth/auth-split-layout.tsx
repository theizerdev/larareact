import { Link, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import BackgroundParticles from '@/components/background-particles';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-svh w-full lg:grid-cols-2 overflow-hidden">
            <BackgroundParticles particleCount={35} colorScheme="brand" />

            {/* Visual panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex border-r border-slate-800 z-10">
                {/* Tech background layers */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 opacity-90" />

                {/* Tech Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                        backgroundSize: '30px 30px, 30px 30px, 30px 30px'
                    }}
                />

                {/* Ambient glowing tech orbs */}
                <div className="absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-indigo-600/25 blur-[100px] pointer-events-none" />

                <Link
                    href={home()}
                    className="relative z-10 flex items-center font-semibold py-2"
                >
                    <div className="relative group">
                        <div className="absolute" />
                        <img
                            src="/image/logo/7.png"
                            alt="FixSale Logo"
                            className="relative h-20 w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                </Link>

                <div className="relative z-10 max-w-md">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm backdrop-blur-md">
                        <ShieldCheck className="size-4 text-cyan-400" />
                        <span className="font-medium text-cyan-200">Controla. Vende. Crece.</span>
                    </div>
                    <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
                        Gestión integral de ventas, inventario y soporte técnico.
                    </h2>
                    <p className="mt-4 text-base text-balance text-white/70">
                        Administra tu punto de venta (POS), órdenes de servicio técnico, facturación y sucursales desde una sola plataforma en la nube.
                    </p>
                </div>

                <p className="relative z-10 text-sm text-white/50">
                    © {new Date().getFullYear()} {name}. Todos los derechos
                    reservados.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex flex-col items-center justify-center bg-background p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <Link
                        href={home()}
                        className="mb-8 flex flex-col items-center justify-center lg:hidden"
                    >
                        <div className="bg-[#0B2545] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 border border-blue-400/20 shadow-md">
                            <span className="font-extrabold tracking-wider text-base text-white">
                                FIX <span className="text-cyan-400 font-black">+</span> SALE
                            </span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mt-1">
                            GESTOR INTEGRAL DE VENTAS Y SERVICIOS
                        </span>
                    </Link>

                    <div className="mb-6 space-y-1 text-center">
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