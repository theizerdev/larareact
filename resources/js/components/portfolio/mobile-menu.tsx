import React, { useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { dashboard, login } from '@/routes';
import type { User } from '@/types';

interface MobileMenuProps {
    auth: { user: User | null };
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ auth, mobileMenuOpen, setMobileMenuOpen }) => {
    const { __ } = useTranslate();

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileMenuOpen, setMobileMenuOpen]);

    const navItems = [
        { id: 'about', label: 'Sobre Mí' },
        { id: 'skills', label: 'Habilidades' },
        { id: 'projects', label: 'Proyectos' },
        { id: 'experience', label: 'Experiencia' },
        { id: 'contact', label: 'Contacto' },
    ];

    return (
        <div className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
            {/* Backdrop overlay */}
            <div
                className={`fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
                    mobileMenuOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <div
                className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
                    mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Theizer.dev
                        </span>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                            aria-label={__('Cerrar')}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body links */}
                    <nav className="flex flex-col space-y-3">
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-950/30"
                            >
                                {__(item.label)}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Footer links */}
                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-900">
                    {auth.user ? (
                        <Link
                            href={dashboard().url}
                            className="flex items-center justify-center w-full py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            {__('Dashboard')}
                        </Link>
                    ) : (
                        <Link
                            href={login().url}
                            className="flex items-center justify-center w-full py-3 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 transition-all"
                        >
                            {__('Iniciar Sesión')}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;

