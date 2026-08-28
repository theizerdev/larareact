import React from 'react';
import { Award, CheckCircle2, Globe, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import type { About } from '@/types';

interface BentoGridAboutProps {
    about: About | null;
}

export const BentoGridAbout: React.FC<BentoGridAboutProps> = ({ about }) => {
    const { __ } = useTranslate();

    return (
        <section id="about" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="space-y-4 mb-12 text-center md:text-left">
                    <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                        {__('Resumen Profesional')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {__('Sobre Mí')}
                    </h2>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Bento Card 1: Main Bio & Profile (Span 8) */}
                    <div className="md:col-span-8 bento-card p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-40 h-48 md:w-52 md:h-60 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                            {about && about.avatar_path ? (
                                <img
                                    src={about.avatar_path}
                                    alt={about.hero_title || 'Avatar de perfil'}
                                    width="200"
                                    height="240"
                                    loading="lazy"
                                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <ShieldCheck className="w-12 h-12" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 flex-grow text-left">
                            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{__('Desarrollador Full Stack Senior')}</span>
                            </div>

                            <div
                                className="text-slate-600 dark:text-slate-350 font-normal leading-relaxed text-sm prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: about && about.bio ? about.bio : __('Biografía profesional no configurada.'),
                                }}
                            />
                        </div>
                    </div>

                    {/* Bento Card 2: Years Experience (Span 4) */}
                    <div className="md:col-span-4 bento-card p-8 flex flex-col justify-between space-y-4">
                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 w-max">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white">
                                {about ? (about.experience_years.toString().includes('+') ? about.experience_years : `${about.experience_years}+`) : '5+'}
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                                {__('Años de Experiencia Profesional')}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Construyendo soluciones web empresariales de alta escalabilidad.')}
                        </p>
                    </div>

                    {/* Bento Card 3: Completed Projects (Span 4) */}
                    <div className="md:col-span-4 bento-card p-8 flex flex-col justify-between space-y-4">
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 w-max">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white">
                                {about ? (about.completed_projects.toString().includes('+') ? about.completed_projects : `${about.completed_projects}+`) : '30+'}
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                                {__('Proyectos Entregados')}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Desarrollos en producción probados con éxito.')}
                        </p>
                    </div>

                    {/* Bento Card 4: Location & Availability (Span 4) */}
                    <div className="md:col-span-4 bento-card p-8 flex flex-col justify-between space-y-4">
                        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 w-max">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Ubicación & Modalidad')}
                            </div>
                            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <span>Venezuela / Remoto Global</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Disponible para proyectos globales y colaboración internacional.')}
                        </p>
                    </div>

                    {/* Bento Card 5: Architecture Focus (Span 4) */}
                    <div className="md:col-span-4 bento-card p-8 flex flex-col justify-between space-y-4">
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 w-max">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {__('Filosofía de Desarrollo')}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {__('Código Limpio, Tipado & Rendimiento')}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Desarrollo modular bajo estándares SOLID y arquitectura desacoplada.')}
                        </p>
                    </div>

                </div>
            </ScrollReveal>
        </section>
    );
};

export default BentoGridAbout;

