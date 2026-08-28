import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';
import { dashboard, login } from '@/routes';
import type { User } from '@/types';

interface AppleNavProps {
    auth: { user: User | null };
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const AppleNav: React.FC<AppleNavProps> = ({ auth, mobileMenuOpen, setMobileMenuOpen }) => {
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
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl">
            <div className="apple-glass-nav rounded-full px-6 h-14 flex items-center justify-between shadow-lg shadow-slate-900/5 transition-all">
                {/* Brand Logo */}
                <a href="#" className="flex items-center space-x-2 font-black text-sm tracking-tight text-slate-900 dark:text-white">
                    <img
                        src="/image/logo/logo.png"
                        alt="LaraReact Logo"
                        width="140"
                        height="40"
                        className="h-9 w-auto object-contain"
                    />
                </a>

                {/* Center Nav Items */}
                <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold">
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`transition-all py-1 px-3 rounded-full ${
                                activeSection === item.id
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* Right Action Controls */}
                <div className="flex items-center space-x-3">
                    <LanguageToggle />

                    {auth.user ? (
                        <Link
                            href={dashboard().url}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full transition-all flex items-center space-x-1"
                        >
                            <span>Dashboard</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <Link
                            href={login().url}
                            className="px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all border border-slate-200 dark:border-slate-800"
                        >
                            {__('Iniciar Sesión')}
                        </Link>
                    )}

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        aria-label={mobileMenuOpen ? __('Cerrar Menú') : __('Abrir Menú')}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppleNav;

