import React from 'react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import type { About } from '@/types';

interface AboutSectionProps {
    about: About | null;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ about }) => {
    const { __ } = useTranslate();

    return (
        <section id="about" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="grid md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-5 flex justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative w-64 h-80 md:w-80 md:h-[400px] rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
                                {about && about.avatar_path ? (
                                    <img
                                        src={about.avatar_path}
                                        alt={about.hero_title ? `Foto de perfil de ${about.hero_title}` : 'Foto de perfil'}
                                        width="320"
                                        height="400"
                                        loading="lazy"
                                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <svg viewBox="0 0 200 200" className="w-48 h-48 text-indigo-500" aria-hidden="true">
                                        <defs>
                                            <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#4f46e5" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="100" cy="100" r="80" fill="url(#avatarGrad)" opacity="0.15" />
                                        <path d="M100 50 C 115 50, 125 60, 125 75 C 125 90, 115 100, 100 100 C 85 100, 75 90, 75 75 C 75 60, 85 50, 100 50 Z" fill="url(#avatarGrad)" />
                                        <path d="M50 150 C 50 120, 70 110, 100 110 C 130 110, 150 120, 150 150 Z" fill="url(#avatarGrad)" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-7 space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight">{__('Sobre Mí')}</h2>
                        <div
                            className="text-slate-600 dark:text-slate-400 font-light leading-relaxed prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: about && about.bio ? about.bio : __('Completa tu biografía profesional en el panel de administración.'),
                            }}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {about ? (
                                        about.experience_years.toString().toLowerCase().includes('año') || about.experience_years.toString().toLowerCase().includes('year')
                                            ? __(about.experience_years)
                                            : `${about.experience_years} ${__('Años')}`
                                    ) : (
                                        __('0 Años')
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{__('Experiencia Profesional')}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {about ? (
                                        about.completed_projects.toString().toLowerCase().includes('proyecto') || about.completed_projects.toString().toLowerCase().includes('project')
                                            ? __(about.completed_projects)
                                            : `${about.completed_projects} ${__('Proyectos')}`
                                    ) : (
                                        __('0 Proyectos')
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{__('Entregados con Éxito')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    );
};

export default AboutSection;

