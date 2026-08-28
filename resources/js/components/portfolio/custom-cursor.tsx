import React, { useState, useEffect, useRef } from 'react';

export const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [cursorHovered, setCursorHovered] = useState(false);

    useEffect(() => {
        // Only run on desktop devices with fine pointer support
        if (typeof window === 'undefined' || !window.matchMedia('(min-width: 768px)').matches) {
            return;
        }

        const moveCursor = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };
        window.addEventListener('mousemove', moveCursor);

        const handleMouseEnter = () => setCursorHovered(true);
        const handleMouseLeave = () => setCursorHovered(false);

        const clickableElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');
        clickableElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            clickableElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            aria-hidden="true"
            className={`hidden md:block fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out ${
                cursorHovered
                    ? 'w-12 h-12 bg-indigo-500/20 border border-indigo-400 scale-100'
                    : 'w-4 h-4 bg-indigo-600 dark:bg-indigo-400 scale-100'
            }`}
            style={{ left: '-100px', top: '-100px' }}
        />
    );
};

export default CustomCursor;

