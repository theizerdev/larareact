import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';
import { dashboard, login } from '@/routes';
import type { User } from '@/types';

interface NavbarProps {
    auth: { user: User | null };
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ auth, mobileMenuOpen, setMobileMenuOpen }) => {
    const { __ } = useTranslate();
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.3 }
        );

        sections.forEach((sec) => observer.observe(sec));
        return () => observer.disconnect();
    }, []);

    const navItems = [
        { id: 'about', label: __('Sobre Mí') },
        { id: 'skills', label: __('Habilidades') },
        { id: 'projects', label: __('Proyectos') },
        { id: 'experience', label: __('Experiencia') },
        { id: 'contact', label: __('Contacto') },
    ];

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/75 dark:bg-slate-950/75 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
            {/* Skip to content link for accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold"
            >
                {__('Saltar al contenido principal')}
            </a>

            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <a href="#" className="flex items-center space-x-2 text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-85 transition-opacity">
                    <img
                        src="/image/logo/logo.png"
                        alt="LaraReact Logo"
                        width="160"
                        height="80"
                        className="h-16 w-auto object-contain"
                    />
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`transition-colors py-1 border-b-2 ${
                                activeSection === item.id
                                    ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold'
                                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center space-x-4">
                    <LanguageToggle />

                    {auth.user ? (
                        <Link
                            href={dashboard().url}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition shadow-lg shadow-indigo-600/20"
                        >
                            {__('Dashboard')}
                        </Link>
                    ) : (
                        <Link
                            href={login().url}
                            className="px-4 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition"
                        >
                            {__('Iniciar Sesión')}
                        </Link>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                        aria-label={mobileMenuOpen ? __('Cerrar Menú') : __('Abrir Menú')}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

