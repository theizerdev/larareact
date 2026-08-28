import React from 'react';
import { Briefcase, Calendar } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import type { Experience } from '@/types';

interface ExperienceTimelineProps {
    experiences: Experience[];
}

export const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({ experiences }) => {
    const { __ } = useTranslate();

    return (
        <section id="experience" className="py-24 max-w-4xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="space-y-3 mb-16 text-center">
                    <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                        {__('Trayectoria Profesional')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {__('Experiencia Laboral')}
                    </h2>
                </div>

                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 space-y-8 pl-6 sm:pl-8 ml-2 sm:ml-4">
                    {experiences.map((exp, expIdx) => (
                        <ScrollReveal key={exp.id} delay={expIdx * 120}>
                            <div className="relative group">
                                {/* Bullet indicator */}
                                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 bg-white dark:bg-slate-950 border-2 border-indigo-600 dark:border-indigo-400 rounded-full group-hover:scale-125 transition-transform" />

                                <div className="bento-card p-6 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center space-x-2">
                                            <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                {exp.role}
                                            </h3>
                                        </div>
                                        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full self-start sm:self-auto flex items-center space-x-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>
                                                {exp.start_date} – {exp.is_current ? __('Presente') : exp.end_date}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                        {exp.company}
                                    </div>

                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed whitespace-pre-line">
                                        {exp.description}
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </ScrollReveal>
        </section>
    );
};

export default ExperienceTimeline;

