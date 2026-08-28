import React from 'react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import type { Experience } from '@/types';

interface ExperienceSectionProps {
    experiences: Experience[];
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences }) => {
    const { __ } = useTranslate();

    return (
        <section id="experience" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50 scroll-mt-16">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center space-y-3 mb-16">
                    <h2 className="text-3xl font-bold tracking-tight">{__('Experiencia Laboral')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-light">{__('Mi recorrido profesional en empresas y proyectos freelance.')}</p>
                </div>

                <div className="relative border-l border-slate-200 dark:border-slate-800 space-y-12 pl-6 ml-4">
                    {experiences.map((exp, expIdx) => (
                        <ScrollReveal key={exp.id} delay={expIdx * 120}>
                            <div className="relative group">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white dark:bg-slate-950 border-2 border-indigo-600 dark:border-indigo-400 rounded-full group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-colors" />

                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <h3 className="text-lg font-bold">{exp.role}</h3>
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 rounded-md self-start sm:self-auto">
                                            {exp.start_date} – {exp.is_current ? __('Presente') : exp.end_date}
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{exp.company}</div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed whitespace-pre-line">
                                        {exp.description}
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ExperienceSection;

