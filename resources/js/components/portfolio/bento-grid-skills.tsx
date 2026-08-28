import React, { useState } from 'react';
import { Search, Code2, Server, Wrench } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import ScrollReveal from './scroll-reveal';
import SkillBar from './skill-bar';
import type { Skill } from '@/types';

interface BentoGridSkillsProps {
    skills: Record<string, Skill[]>;
}

export const BentoGridSkills: React.FC<BentoGridSkillsProps> = ({ skills }) => {
    const { __ } = useTranslate();
    const [searchTerm, setSearchTerm] = useState('');

    const categoryIcons: Record<string, React.ReactNode> = {
        Frontend: <Code2 className="w-5 h-5 text-indigo-500" />,
        Backend: <Server className="w-5 h-5 text-purple-500" />,
        DevOps: <Wrench className="w-5 h-5 text-emerald-500" />,
    };

    return (
        <section id="skills" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
            <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-3">
                        <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                            {__('Habilidades & Dominio Técnico')}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {__('Tecnologías & Herramientas')}
                        </h2>
                    </div>

                    {/* Minimalist Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder={__('Buscar tecnología...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.keys(skills).map((category, catIdx) => {
                        const categorySkills = skills[category].filter(s =>
                            s.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        if (searchTerm && categorySkills.length === 0) return null;

                        return (
                            <div key={category} className="bento-card p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                                                {categoryIcons[category] || <Code2 className="w-5 h-5 text-indigo-500" />}
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                                {__(category)}
                                            </h3>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            {categorySkills.length}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {categorySkills.map((skill) => (
                                            <div key={skill.id} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {skill.name}
                                                    </span>
                                                    <span className="font-mono text-slate-400">{skill.proficiency}%</span>
                                                </div>
                                                <SkillBar proficiency={skill.proficiency} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollReveal>
        </section>
    );
};

export default BentoGridSkills;

