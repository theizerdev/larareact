import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useTranslate } from '@/hooks/use-translate';
import type { Client } from '@/types';

import 'swiper/css';

interface ClientsSectionProps {
    clients: Client[];
}

export const ClientsSection: React.FC<ClientsSectionProps> = ({ clients }) => {
    const { __ } = useTranslate();

    if (!clients || clients.length === 0) return null;

    const duplicatedClients = clients.length < 12
        ? [...clients, ...clients, ...clients]
        : clients;

    return (
        <section id="clients" className="py-16 bg-slate-100/30 dark:bg-slate-900/10 border-b border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center space-y-2 mb-10">
                    <span className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                        {__('Clientes Actuales')}
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                        {__('Marcas y Empresas que Confían en Mí')}
                    </h2>
                </div>

                <div className="swiper-wrapper-linear pointer-events-none md:pointer-events-auto">
                    <Swiper
                        modules={[Autoplay]}
                        spaceBetween={20}
                        slidesPerView={2}
                        loop={true}
                        speed={4000}
                        autoplay={{
                            delay: 0,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        breakpoints={{
                            480: { slidesPerView: 3, spaceBetween: 30 },
                            768: { slidesPerView: 4, spaceBetween: 40 },
                            1024: { slidesPerView: 5, spaceBetween: 50 },
                            1280: { slidesPerView: 6, spaceBetween: 60 },
                        }}
                        className="py-4"
                    >
                        {duplicatedClients.map((client, idx) => (
                            <SwiperSlide key={`${client.id}-${idx}`} className="flex items-center justify-center">
                                <a
                                    href={client.website_url || '#'}
                                    target={client.website_url ? "_blank" : undefined}
                                    rel={client.website_url ? "noopener noreferrer" : undefined}
                                    className={`w-full h-20 flex items-center justify-center p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 ${
                                        client.website_url ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                >
                                    {client.logo_path ? (
                                        <img
                                            src={client.logo_path}
                                            alt={client.name}
                                            width="120"
                                            height="48"
                                            loading="lazy"
                                            className="max-h-12 max-w-full object-contain filter grayscale opacity-60 dark:opacity-40 hover:grayscale-0 hover:opacity-100 dark:hover:opacity-100 transition-all duration-300"
                                        />
                                    ) : (
                                        <span className="font-bold text-sm tracking-wider text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase">
                                            {client.name}
                                        </span>
                                    )}
                                </a>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default ClientsSection;

