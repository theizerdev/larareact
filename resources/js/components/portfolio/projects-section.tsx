import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { useTranslate } from '@/hooks/use-translate';
import GlowCard from './glow-card';
import type { Project } from '@/types';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ProjectsSectionProps {
    projects: Project[];
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => {
    const { __ } = useTranslate();
    const [activeFilter, setActiveFilter] = useState('All');

    const categories = ['All', 'Frontend', 'Backend', 'Fullstack'];

    const filteredProjects = activeFilter === 'All'
        ? projects
        : projects.filter(p => p.category.toLowerCase() === activeFilter.toLowerCase());

    return (
        <section id="projects" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">{__('Proyectos Destacados')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 font-light">{__('Una selección de mis últimos desarrollos y trabajos representativos.')}</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center overflow-x-auto space-x-2 pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                                activeFilter === cat
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {__(cat)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects Swiper Carousel */}
            {filteredProjects.length > 0 ? (
                <div className="relative px-2">
                    <Swiper
                        key={activeFilter}
                        modules={[Autoplay, Pagination, Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        navigation={true}
                        autoplay={{
                            delay: 4500,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2, spaceBetween: 24 },
                            1024: { slidesPerView: 3, spaceBetween: 28 },
                        }}
                        className="pb-16 pt-2 px-1 projects-swiper"
                    >
                        {filteredProjects.map((project) => (
                            <SwiperSlide key={project.id} className="h-auto pb-4">
                                <GlowCard className="group hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                    {/* Image / Thumbnail Container */}
                                    <div className="relative aspect-video bg-gradient-to-br from-indigo-900/20 to-purple-900/20 dark:from-indigo-950/50 dark:to-purple-950/50 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                                        {project.image_path ? (
                                            <img
                                                src={project.image_path}
                                                alt={project.title}
                                                width="400"
                                                height="225"
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <svg className="w-16 h-16 text-indigo-500/50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        )}

                                        {project.is_featured ? (
                                            <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold text-white bg-indigo-600 rounded-full uppercase tracking-wider">
                                                {__('Destacado')}
                                            </span>
                                        ) : null}

                                        <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full uppercase tracking-wider">
                                            {__(project.category)}
                                        </span>
                                    </div>

                                    {/* Content Container */}
                                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed line-clamp-3">
                                                {project.description}
                                            </p>

                                            {/* Tech Stack Pills */}
                                            {((Array.isArray(project.frontend_tech) && project.frontend_tech.length > 0) ||
                                              (Array.isArray(project.backend_tech) && project.backend_tech.length > 0)) && (
                                                <div className="pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800/80 mt-3">
                                                    {Array.isArray(project.frontend_tech) && project.frontend_tech.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider text-indigo-500 dark:text-indigo-400 uppercase mr-1">
                                                                {__('Frontend:')}
                                                            </span>
                                                            {project.frontend_tech.map((tech, idx) => (
                                                                <span
                                                                    key={`fe-pill-${idx}`}
                                                                    className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {Array.isArray(project.backend_tech) && project.backend_tech.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mr-1">
                                                                {__('Backend:')}
                                                            </span>
                                                            {project.backend_tech.map((tech, idx) => (
                                                                <span
                                                                    key={`be-pill-${idx}`}
                                                                    className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-3 pt-2">
                                            {project.live_url ? (
                                                <a
                                                    href={project.live_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                                                >
                                                    {__('Demo En Vivo')}
                                                    <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            ) : null}
                                            {project.github_url ? (
                                                <a
                                                    href={project.github_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    {__('Ver Código')}
                                                    <svg className="w-3.5 h-3.5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" />
                                                    </svg>
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </GlowCard>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                    {__('No hay proyectos cargados en esta categoría.')}
                </div>
            )}
        </section>
    );
};

export default ProjectsSection;

