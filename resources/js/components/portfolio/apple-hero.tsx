import React from 'react';
import { ArrowRight, Sparkles, Code, CheckCircle } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import Typewriter from './typewriter';
import type { About } from '@/types';

interface AppleHeroProps {
    about: About | null;
}

export const AppleHero: React.FC<AppleHeroProps> = ({ about }) => {
    const { __ } = useTranslate();

    const name = about?.hero_title || 'Theizer Gonzalez';

    return (
        <section className="relative pt-36 pb-20 min-h-screen flex flex-col justify-center items-center px-6 text-center">
            <div className="max-w-5xl w-full mx-auto space-y-8 z-10">

                {/* Minimalist Status Badge */}
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{about?.hero_badge || __('Disponible para nuevos proyectos')}</span>
                </div>

                {/* Massive Crisp Headline */}
                <div className="space-y-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-slate-950 dark:text-white">
                        {__('Construyendo el futuro de la web con')}{' '}
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 dark:from-indigo-400 dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
                            {name}
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed min-h-[4rem] sm:min-h-0">
                        {__('Desarrollador Web Full Stack apasionado por')} <Typewriter phrases={[
                            __('aplicaciones web de alto rendimiento.'),
                            __('arquitecturas limpias con Laravel & React.'),
                            __('diseño de software de nivel internacional.'),
                            __('soluciones digitales escalables.')
                        ]} />
                    </p>
                </div>

                {/* Stripe-style CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                        href="#projects"
                        className="w-full sm:w-auto px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full transition-all duration-300 hover:scale-[1.02] shadow-xl flex items-center justify-center space-x-2"
                    >
                        <span>{__('Ver Proyectos')}</span>
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="#contact"
                        className="w-full sm:w-auto px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-full transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                        <span>{__('Contactar')}</span>
                    </a>
                </div>

                {/* Clean Developer Feature Pills */}
                <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 max-w-3xl mx-auto">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                        <span>{__('Arquitectura Laravel & Inertia')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                        <span>{__('Interfaces React & TypeScript')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>{__('Optimización SEO & Speed')}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppleHero;

