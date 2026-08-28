import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import type { User, About, Project, Skill, Experience, Client } from '@/types';

import AppleNav from '@/components/portfolio/apple-nav';
import MobileMenu from '@/components/portfolio/mobile-menu';
import AppleHero from '@/components/portfolio/apple-hero';
import BentoGridAbout from '@/components/portfolio/bento-grid-about';
import BentoGridSkills from '@/components/portfolio/bento-grid-skills';
import ProjectsShowcase from '@/components/portfolio/projects-showcase';
import ClientsSection from '@/components/portfolio/clients-section';
import ExperienceTimeline from '@/components/portfolio/experience-timeline';
import AppleContact from '@/components/portfolio/apple-contact';
import AppleFooter from '@/components/portfolio/apple-footer';

interface WelcomeProps {
    auth: { user: User | null };
    about: About | null;
    projects: Project[];
    skills: Record<string, Skill[]>;
    experiences: Experience[];
    clients?: Client[];
}

export default function Welcome({ auth, about, projects, skills, experiences, clients = [] }: WelcomeProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const metaDescription = about?.hero_subtitle || 'Portafolio Profesional de Desarrollador Web Full Stack. Construyendo aplicaciones web de alto rendimiento, optimizadas y con un diseño estético de primer nivel.';
    const metaKeywords = 'Theizer Gonzalez, Desarrollador Web, Full Stack Developer, Laravel, React, PHP, JavaScript, Portafolio, Programador, SEO';
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://theizerdev.com';
    const authorName = about?.hero_title || 'Theizer Gonzalez';
    const avatarUrl = about?.avatar_path ? `${siteUrl}${about.avatar_path}` : '';

    return (
        <>
            <Head>
                <title>{about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'}</title>
                <meta name="description" content={metaDescription} head-key="description" />
                <meta name="keywords" content={metaKeywords} head-key="keywords" />
                <meta name="author" content={authorName} head-key="author" />
                <meta name="robots" content="index, follow" head-key="robots" />
                <link rel="canonical" href={siteUrl} head-key="canonical" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" head-key="og:type" />
                <meta property="og:url" content={siteUrl} head-key="og:url" />
                <meta property="og:title" content={about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'} head-key="og:title" />
                <meta property="og:description" content={metaDescription} head-key="og:description" />
                {avatarUrl && <meta property="og:image" content={avatarUrl} head-key="og:image" />}

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" head-key="twitter:card" />
                <meta name="twitter:url" content={siteUrl} head-key="twitter:url" />
                <meta name="twitter:title" content={about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'} head-key="twitter:title" />
                <meta name="twitter:description" content={metaDescription} head-key="twitter:description" />
                {avatarUrl && <meta name="twitter:image" content={avatarUrl} head-key="twitter:image" />}
            </Head>

            <div className="min-h-screen text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500 font-sans antialiased selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">

                {/* Floating Glass Navbar */}
                <AppleNav
                    auth={auth}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* Off-canvas Mobile Menu */}
                <MobileMenu
                    auth={auth}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* Main Sections */}
                <main id="main-content" className="relative z-10">
                    <AppleHero about={about} />
                    <BentoGridAbout about={about} />
                    <BentoGridSkills skills={skills} />
                    <ProjectsShowcase projects={projects} />
                    <ClientsSection clients={clients} />
                    <ExperienceTimeline experiences={experiences} />
                    <AppleContact />
                </main>

                {/* Footer */}
                <AppleFooter />
            </div>
        </>
    );
}
