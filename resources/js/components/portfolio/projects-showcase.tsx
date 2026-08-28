import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ExternalLink, Github, Sparkles } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import type { Project } from '@/types';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ProjectsShowcaseProps {
    projects: Project[];
}

export const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({ projects }) => {
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
                    <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                        {__('Portafolio de Entregables')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {__('Proyectos Destacados')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-normal max-w-xl">
                        {__('Una selección de mis aplicaciones web de alto rendimiento entregadas en producción.')}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center overflow-x-auto space-x-2 pb-2 md:pb-0 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                                activeFilter === cat
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            {__(cat)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Swiper Projects Carousel */}
            {filteredProjects.length > 0 ? (
                <div className="relative px-1">
                    <Swiper
                        key={activeFilter}
                        modules={[Autoplay, Pagination, Navigation]}
                        spaceBetween={24}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        navigation={true}
                        autoplay={{
                            delay: 5000,
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
                                <div className="bento-card group h-full flex flex-col overflow-hidden">
                                    {/* Thumbnail Image Container */}
                                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                                        {project.image_path ? (
                                            <img
                                                src={project.image_path}
                                                alt={project.title}
                                                width="400"
                                                height="225"
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                                                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                                                <span className="text-xs font-mono">{project.title}</span>
                                            </div>
                                        )}

                                        {project.is_featured ? (
                                            <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-extrabold text-white bg-indigo-600 rounded-full uppercase tracking-wider shadow-md">
                                                {__('Destacado')}
                                            </span>
                                        ) : null}

                                        <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-800">
                                            {__(project.category)}
                                        </span>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed line-clamp-3">
                                                {project.description}
                                            </p>

                                            {/* Tech Stack Pills */}
                                            {((Array.isArray(project.frontend_tech) && project.frontend_tech.length > 0) ||
                                              (Array.isArray(project.backend_tech) && project.backend_tech.length > 0)) && (
                                                <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 mt-3">
                                                    {Array.isArray(project.frontend_tech) && project.frontend_tech.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase mr-1">
                                                                Frontend:
                                                            </span>
                                                            {project.frontend_tech.map((tech, idx) => (
                                                                <span
                                                                    key={`fe-pill-${idx}`}
                                                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {Array.isArray(project.backend_tech) && project.backend_tech.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mr-1">
                                                                Backend:
                                                            </span>
                                                            {project.backend_tech.map((tech, idx) => (
                                                                <span
                                                                    key={`be-pill-${idx}`}
                                                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                                >
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Links */}
                                        <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {project.live_url ? (
                                                <a
                                                    href={project.live_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity space-x-1"
                                                >
                                                    <span>{__('Demo En Vivo')}</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : null}
                                            {project.github_url ? (
                                                <a
                                                    href={project.github_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors space-x-1"
                                                >
                                                    <Github className="w-3.5 h-3.5" />
                                                    <span>{__('Ver Código')}</span>
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            ) : (
                <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                    {__('No hay proyectos cargados en esta categoría.')}
                </div>
            )}
        </section>
    );
};

export default ProjectsShowcase;

