import React from 'react';
import { useTranslate } from '@/hooks/use-translate';

export const Footer: React.FC = () => {
    const { __ } = useTranslate();

    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div>
                    &copy; {new Date().getFullYear()} Theizer dev. {__('Todos los derechos reservados.')}
                </div>
                <div className="flex items-center space-x-6">
                    <a
                        href="https://github.com/theizerdev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        aria-label="GitHub de Theizer dev"
                    >
                        GitHub
                    </a>
                    <a
                        href="https://linkedin.com/in/theizer-gonzalez-1a6459179"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        aria-label="LinkedIn de Theizer dev"
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

