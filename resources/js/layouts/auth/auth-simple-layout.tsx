import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import BackgroundParticles from '@/components/background-particles';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6 overflow-hidden">
            <BackgroundParticles particleCount={30} colorScheme="brand" />
            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-1 font-medium"
                        >
                            <img
                                src="/image/logo/5.png"
                                alt="FixSale Logo"
                                className="h-16 w-auto object-contain transition-transform hover:scale-105"
                            />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-bold">{title}</h1>
                            {description && (
                                <p className="text-center text-xs text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
