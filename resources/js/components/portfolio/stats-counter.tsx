import React from 'react';
import { Award, Code2, CheckCircle2, Zap } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import type { About } from '@/types';

interface StatsCounterProps {
    about: About | null;
}

export const StatsCounter: React.FC<StatsCounterProps> = ({ about }) => {
    const { __ } = useTranslate();

    const stats = [
        {
            icon: <Award className="w-5 h-5 text-indigo-500" />,
            value: about?.experience_years ? (about.experience_years.toString().includes('+') ? about.experience_years : `${about.experience_years}+`) : '5+',
            label: __('Años de Experiencia'),
            sub: __('En Desarrollo Web Full Stack'),
        },
        {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
            value: about?.completed_projects ? (about.completed_projects.toString().includes('+') ? about.completed_projects : `${about.completed_projects}+`) : '30+',
            label: __('Proyectos Entregados'),
            sub: __('100% de Éxito en Producción'),
        },
        {
            icon: <Code2 className="w-5 h-5 text-purple-500" />,
            value: '100%',
            label: __('Código Limpio & Tipado'),
            sub: __('Arquitectura Escalable'),
        },
        {
            icon: <Zap className="w-5 h-5 text-amber-500" />,
            value: '99.9%',
            label: __('Disponibilidad & Speed'),
            sub: __('Rendimiento Optimizado SEO'),
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto pt-8">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="p-5 rounded-2xl glass-card-futuristic hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 group flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 group-hover:scale-110 transition-transform">
                            {stat.icon}
                        </div>
                        <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {stat.value}
                        </span>
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                            {stat.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-0.5">
                            {stat.sub}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCounter;

