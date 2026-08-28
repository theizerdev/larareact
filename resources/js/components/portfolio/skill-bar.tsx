import React, { useState, useEffect, useRef } from 'react';

interface SkillBarProps {
    proficiency: number;
}

export const SkillBar: React.FC<SkillBarProps> = ({ proficiency }) => {
    const [width, setWidth] = useState(0);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const t = setTimeout(() => setWidth(proficiency), 100);
                    observer.unobserve(entry.target);
                    return () => clearTimeout(t);
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [proficiency]);

    return (
        <div ref={elementRef} className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-[1200ms] ease-out"
                style={{ width: `${width}%` }}
            />
        </div>
    );
};

export default SkillBar;

