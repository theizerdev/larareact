import React from 'react';
import { useTranslate } from '@/hooks/use-translate';

export const AppleFooter: React.FC = () => {
    const { __ } = useTranslate();

    return (
        <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 py-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white">Theizer dev</span>
                    <span>&copy; {new Date().getFullYear()}. {__('Todos los derechos reservados.')}</span>
                </div>
                <div className="flex items-center space-x-6">
                    <a
                        href="https://github.com/theizerdev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        GitHub
                    </a>
                    <a
                        href="https://linkedin.com/in/theizer-gonzalez-1a6459179"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default AppleFooter;

