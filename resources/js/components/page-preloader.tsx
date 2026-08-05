import React, { useEffect, useState } from 'react';

interface PagePreloaderProps {
    logoPath?: string;
    durationMs?: number;
    appName?: string;
    slogan?: string;
}

export default function PagePreloader({
    logoPath = '/image/logo/2.png',
    durationMs = 1100,
    appName = 'FixSale',
    slogan = 'Controla. Vende. Crece.',
}: PagePreloaderProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, durationMs);

        const removeTimer = setTimeout(() => {
            setIsVisible(false);
        }, durationMs + 600);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [durationMs]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl transition-all duration-700 ease-in-out ${
                isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
            }`}
            aria-label="Cargando FixSale"
        >
            {/* Contenedor del Logo Mini (Isotipo 2.png) con AniAura en Marca */}
            <div className="relative flex items-center justify-center mb-8">
                {/* Ring exterior giratorio con colores de marca */}
                <div className="absolute w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#08264e] via-[#ff5a00] to-[#08264e] opacity-80 animate-spin blur-md" />
                
                {/* Glow de fondo animado */}
                <div className="absolute w-32 h-32 rounded-full bg-[#ff5a00]/15 blur-2xl animate-pulse" />

                {/* Tarjeta Glassmorphism del Logo Mini */}
                <div className="relative w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-2xl flex items-center justify-center p-3.5 transition-transform duration-500 hover:scale-105">
                    <img
                        src={logoPath}
                        alt={appName}
                        className="w-full h-full object-contain animate-pulse"
                    />
                </div>
            </div>

            {/* Texto de Marca & Eslogan */}
            <div className="text-center space-y-2 px-4">
                <div className="flex items-center justify-center gap-1.5 text-2xl font-black text-[#08264e] tracking-tight font-sans">
                    <span>Fix</span>
                    <span className="text-[#ff5a00]">Sale</span>
                </div>
                <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    {slogan}
                </p>
            </div>

            {/* Barra de Progreso Elegante */}
            <div className="mt-8 w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
                <div className="h-full bg-gradient-to-r from-[#08264e] via-[#ff5a00] to-[#08264e] rounded-full animate-[preloader-progress_1.2s_ease-in-out_infinite]" />
            </div>

            {/* Puntos de carga animados */}
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-400 font-medium font-mono">
                <span>Cargando plataforma</span>
                <span className="animate-bounce inline-block delay-100">.</span>
                <span className="animate-bounce inline-block delay-200">.</span>
                <span className="animate-bounce inline-block delay-300">.</span>
            </div>

            {/* Estilos Keyframe inline para la animación de la barra de progreso */}
            <style>{`
                @keyframes preloader-progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    50% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
