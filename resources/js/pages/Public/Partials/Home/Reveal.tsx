import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = {
    children: ReactNode;
    className?: string;
};

function alreadyVisible() {
    if (typeof window === 'undefined') {
        return true;
    }

    return (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        typeof IntersectionObserver === 'undefined'
    );
}

// React equivalent of the original's IntersectionObserver-driven `.reveal` class.
export default function Reveal({ children, className }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(alreadyVisible);

    useEffect(() => {
        if (visible) {
            return;
        }

        const el = ref.current;

        if (!el) {
            return;
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    io.unobserve(el);
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );
        io.observe(el);

        return () => io.disconnect();
    }, [visible]);

    return (
        <div
            ref={ref}
            className={cn('hosho-reveal', visible && 'is-in', className)}
        >
            {children}
        </div>
    );
}
