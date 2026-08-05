import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    radius: number;
    color: string;
    vx: number;
    vy: number;
    alpha: number;
    dAlpha: number;
}

interface BackgroundParticlesProps {
    className?: string;
    particleCount?: number;
    colorScheme?: 'brand' | 'dark' | 'emerald';
}

export default function BackgroundParticles({
    className = '',
    particleCount = 35,
    colorScheme = 'brand',
}: BackgroundParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Paleta de partículas según el esquema de color
        const getColors = () => {
            if (colorScheme === 'brand') {
                return [
                    'rgba(255, 90, 0, ',   // Naranja FixSale
                    'rgba(8, 38, 78, ',    // Azul Navy FixSale
                    'rgba(16, 185, 129, ', // Esmeralda / WhatsApp
                    'rgba(245, 158, 11, ', // Amber
                ];
            }
            if (colorScheme === 'dark') {
                return [
                    'rgba(255, 90, 0, ',
                    'rgba(99, 102, 241, ',
                    'rgba(16, 185, 129, ',
                ];
            }
            return [
                'rgba(16, 185, 129, ',
                'rgba(59, 130, 246, ',
            ];
        };

        const colors = getColors();

        // Inicializar partículas
        const particles: Particle[] = Array.from({ length: particleCount }).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.5 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.4 + 0.15,
            dAlpha: (Math.random() - 0.5) * 0.005,
        }));

        // Bucle de animación 60 FPS
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Dibujar partículas y conexiones suaves
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Movimiento
                p.x += p.vx;
                p.y += p.vy;

                // Transparencia fluctuante suave
                p.alpha += p.dAlpha;
                if (p.alpha <= 0.1 || p.alpha >= 0.5) {
                    p.dAlpha = -p.dAlpha;
                }

                // Rebote suave en bordes
                if (p.x < 0 || p.x > width) p.vx = -p.vx;
                if (p.y < 0 || p.y > height) p.vy = -p.vy;

                // Dibujar círculo de partícula
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${p.alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = `${p.color}0.5)`;
                ctx.fill();

                // Conectar partículas cercanas con líneas suaves
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        const lineAlpha = (1 - dist / 130) * 0.12;
                        ctx.strokeStyle = `rgba(255, 90, 0, ${lineAlpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, colorScheme]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        />
    );
}
