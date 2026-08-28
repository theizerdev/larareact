import React from 'react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import GlowCard from './glow-card';
import SkillBar from './skill-bar';
import type { Skill } from '@/types';

interface SkillsSectionProps {
    skills: Record<string, Skill[]>;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills }) => {
    const { __ } = useTranslate();

    return (
        <section id="skills" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50 scroll-mt-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center space-y-3 mb-16">
                    <h2 className="text-3xl font-bold tracking-tight">{__('Habilidades y Tecnologías')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-light">{__('Mi arsenal técnico para dar vida a ideas innovadoras.')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {Object.keys(skills).map((category, catIdx) => (
                        <ScrollReveal key={category} delay={catIdx * 150}>
                            <GlowCard className="p-6">
                                <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-xs mb-6">
                                    {__(category)}
                                </h3>
                                <div className="space-y-4">
                                    {skills[category].map((skill) => (
                                        <div key={skill.id} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{skill.name}</span>
                                                <span className="text-slate-500 dark:text-slate-400">{skill.proficiency}%</span>
                                            </div>
                                            <SkillBar proficiency={skill.proficiency} />
                                        </div>
                                    ))}
                                </div>
                            </GlowCard>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SkillsSection;

