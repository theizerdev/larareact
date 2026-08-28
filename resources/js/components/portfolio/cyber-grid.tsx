import React from 'react';

export const CyberGrid: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            {/* Cyber Grid Overlay */}
            <div className="absolute inset-0 cyber-grid-pattern opacity-60 dark:opacity-40" />

            {/* Glowing Radial Background Gradients */}
            <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-pink-500/0 blur-[120px] animate-pulse-glow" />
            <div className="absolute top-[45%] right-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-purple-600/15 via-indigo-500/10 to-cyan-500/0 blur-[140px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            <div className="absolute bottom-[-10%] left-[-5%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-purple-600/0 blur-[150px] animate-pulse-glow" style={{ animationDelay: '3s' }} />
        </div>
    );
};

export default CyberGrid;

