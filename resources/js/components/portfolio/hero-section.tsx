import React from 'react';
import { useTranslate } from '@/hooks/use-translate';
import Typewriter from './typewriter';
import type { About } from '@/types';

interface HeroSectionProps {
    about: About | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ about }) => {
    const { __ } = useTranslate();

    return (
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 overflow-hidden">
            <div className="max-w-4xl text-center z-10 space-y-8">
                <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 rounded-full uppercase">
                    {about?.hero_badge || __('Disponible para Proyectos')}
                </span>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
                    {__('Hola, soy')}{' '}
                    <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {about?.hero_title || 'Theizer dev'}
                    </span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed min-h-[4rem] sm:min-h-0">
                    {__('Desarrollador Web Full Stack apasionado por construir')}{' '}
                    <Typewriter
                        phrases={[
                            __('aplicaciones interactivas y eficientes.'),
                            __('interfaces modernas y fluidas.'),
                            __('soluciones web con diseño premium.'),
                            __('arquitecturas escalables e intuitivas.'),
                        ]}
                    />
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="#projects"
                        className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 dark:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                    >
                        {__('Ver Proyectos')}
                    </a>
                    <a
                        href="#contact"
                        className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all hover:-translate-y-0.5"
                    >
                        {__('Contactar')}
                    </a>
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
};

export default HeroSection;

