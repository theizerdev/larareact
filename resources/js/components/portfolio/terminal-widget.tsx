import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Layers } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import type { About } from '@/types';

interface TerminalWidgetProps {
    about: About | null;
}

export const TerminalWidget: React.FC<TerminalWidgetProps> = ({ about }) => {
    const { __ } = useTranslate();
    const [activeTab, setActiveTab] = useState<'json' | 'stack' | 'services'>('json');
    const [copied, setCopied] = useState(false);

    const name = about?.hero_title || 'Theizer Gonzalez';

    const codeSnippets = {
        json: `{
  "developer": "${name}",
  "role": "Full Stack Architect",
  "status": "Available for Projects",
  "stack": ["Laravel", "React", "TypeScript", "Tailwind CSS"],
  "location": "Venezuela / Remote Worldwide",
  "experience": "${about?.experience_years || '5+'} Years",
  "completed_projects": "${about?.completed_projects || '30+'}",
  "contact": {
    "github": "@theizerdev",
    "email": "contact@theizerdev.com"
  }
}`,
        stack: `// stack.config.ts
export const developerProfile = {
  architecture: "RESTful & Event-Driven",
  frontend: ["React 19", "Inertia.js", "Tailwind CSS v4", "TypeScript"],
  backend: ["PHP 8.3", "Laravel 12", "MySQL/PostgreSQL", "Redis"],
  devops: ["Docker", "Git/CI-CD", "Nginx", "Linux Administration"],
  qualityAssurance: ["Clean Architecture", "Unit Testing", "SEO Optimization"]
} as const;`,
        services: `# services.yml
services:
  web_development:
    type: "Full Stack Web Apps"
    speed: "High Performance"
    responsive: true
  api_design:
    type: "Robust REST & GraphQL APIs"
    security: "Sanctum / JWT Authentication"
  ui_ux:
    type: "Futuristic Glassmorphism & Responsive UI"
    accessibility: "WCAG Compliant"
`
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippets[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden glass-card-futuristic border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-indigo-500/10 font-mono text-xs sm:text-sm text-left transition-all duration-300">
            {/* Header / Window Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 select-none">
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-slate-400 text-xs hidden sm:inline-flex items-center space-x-1">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>theizerdev-cli</span>
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                            activeTab === 'json'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>profile.json</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stack')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                            activeTab === 'stack'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>stack.ts</span>
                    </button>
                </div>

                {/* Copy Button */}
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={__('Copiar código')}
                    aria-label={__('Copiar código')}
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {/* Code Body */}
            <div className="p-5 bg-slate-950 text-slate-100 overflow-x-auto relative min-h-[220px]">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>200 OK • Live Status</span>
                </div>

                <pre className="font-mono text-xs leading-relaxed">
                    <code>
                        {codeSnippets[activeTab].split('\n').map((line, i) => {
                            let coloredLine = line;
                            if (line.includes('":')) {
                                const parts = line.split('":');
                                return (
                                    <div key={i} className="table-row">
                                        <span className="table-cell pr-4 text-slate-600 select-none text-right">{i + 1}</span>
                                        <span className="table-cell">
                                            <span className="text-purple-400">{parts[0]}"</span>
                                            <span className="text-slate-400">:</span>
                                            <span className="text-emerald-300">{parts[1]}</span>
                                        </span>
                                    </div>
                                );
                            }
                            if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
                                return (
                                    <div key={i} className="table-row">
                                        <span className="table-cell pr-4 text-slate-600 select-none text-right">{i + 1}</span>
                                        <span className="table-cell text-slate-500 italic">{line}</span>
                                    </div>
                                );
                            }
                            return (
                                <div key={i} className="table-row">
                                    <span className="table-cell pr-4 text-slate-600 select-none text-right">{i + 1}</span>
                                    <span className="table-cell text-slate-200">{coloredLine}</span>
                                </div>
                            );
                        })}
                    </code>
                </pre>
            </div>
        </div>
    );
};

export default TerminalWidget;

