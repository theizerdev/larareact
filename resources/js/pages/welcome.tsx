import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { dashboard, login } from '@/routes';
import { store as contactStore } from '@/routes/contact';
import type { User, About, Project, Skill, Experience, Client } from '@/types';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';
import { Menu, X } from 'lucide-react';

interface WelcomeProps {
    auth: { user: User | null };
    about: About | null;
    projects: Project[];
    skills: Record<string, Skill[]>;
    experiences: Experience[];
    clients?: Client[];
}

const Typewriter = ({ phrases }: { phrases: string[] }) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const currentPhrase = phrases[currentPhraseIndex];
        const typingSpeed = isDeleting ? 35 : 75;

        if (!isDeleting && displayedText === currentPhrase) {
            timer = setTimeout(() => setIsDeleting(true), 2500);
        } else if (isDeleting && displayedText === '') {
            setIsDeleting(false);
            setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        } else {
            timer = setTimeout(() => {
                setDisplayedText(
                    isDeleting
                        ? currentPhrase.substring(0, displayedText.length - 1)
                        : currentPhrase.substring(0, displayedText.length + 1)
                );
            }, typingSpeed);
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentPhraseIndex, phrases]);

    return (
        <span className="border-r-2 border-indigo-500 dark:border-indigo-400 pr-1 animate-blink font-semibold text-indigo-600 dark:text-indigo-400">
            {displayedText}
        </span>
    );
};

const GlowCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-305 ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 bg-[radial-gradient(350px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(99,102,241,0.06),transparent_80%)] dark:bg-[radial-gradient(350px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(139,92,246,0.04),transparent_80%)]" />
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>
        </div>
    );
};

const ScrollReveal = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={elementRef}
            className={`transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const SkillBar = ({ proficiency }: { proficiency: number }) => {
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

export default function Welcome({ auth, about, projects, skills, experiences, clients = [] }: WelcomeProps) {
    const { __ } = useTranslate();
    const [theme, setTheme] = useState('dark');
    const [activeFilter, setActiveFilter] = useState('All');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const [cursorHovered, setCursorHovered] = useState(false);

    // Form management via Inertia
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [formSuccessMessage, setFormSuccessMessage] = useState('');

    const duplicatedClients = clients && clients.length > 0
        ? (clients.length < 12
            ? [...clients, ...clients, ...clients]
            : clients)
        : [];

    const countries = [
        { name: 'Venezuela', code: '+58', flag: '🇻🇪' },
        { name: 'Colombia', code: '+57', flag: '🇨🇴' },
        { name: 'España', code: '+34', flag: '🇪🇸' },
        { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
        { name: 'Argentina', code: '+54', flag: '🇦🇷' },
        { name: 'Chile', code: '+56', flag: '🇨🇱' },
        { name: 'México', code: '+52', flag: '🇲🇽' },
        { name: 'Perú', code: '+51', flag: '🇵🇪' },
        { name: 'Ecuador', code: '+593', flag: '🇪🇨' },
        { name: 'Uruguay', code: '+598', flag: '🇺🇾' },
        { name: 'Paraguay', code: '+595', flag: '🇵🇾' },
        { name: 'Bolivia', code: '+591', flag: '🇧🇴' },
        { name: 'Costa Rica', code: '+506', flag: '🇨🇷' },
        { name: 'Panamá', code: '+507', flag: '🇵🇦' },
        { name: 'Canadá', code: '+1', flag: '🇨🇦' },
        { name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
    ];

    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [phoneInput, setPhoneInput] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.includes(searchQuery)
    );

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanVal = value.replace(/\D/g, '');
        setPhoneInput(cleanVal);
        setData('phone', cleanVal ? `${selectedCountry.code}${cleanVal}` : '');
    };

    const handleSelectCountry = (country: typeof countries[0]) => {
        setSelectedCountry(country);
        setDropdownOpen(false);
        setSearchQuery('');
        setData('phone', phoneInput ? `${country.code}${phoneInput}` : '');
    };

    // Toggle Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Custom Cursor tracking
    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };
        window.addEventListener('mousemove', moveCursor);

        // Add hover effect listeners to clickable elements
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
    }, [projects, skills, experiences]);

    // Canvas Particles Background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Handle resizing
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Particle configuration
        const particleCount = Math.min(Math.floor(window.innerWidth / 12), 120);
        const particles: Particle[] = [];
        const mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 160 };

        const canvasEl = canvas;

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;

            constructor() {
                this.x = Math.random() * canvasEl.width;
                this.y = Math.random() * canvasEl.height;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
                this.radius = Math.random() * 2.5 + 1.2;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = theme === 'dark' ? 'rgba(129, 140, 248, 0.55)' : 'rgba(79, 70, 229, 0.35)';
                ctx.fill();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce boundaries
                if (this.x < 0 || this.x > canvasEl.width) this.vx = -this.vx;
                if (this.y < 0 || this.y > canvasEl.height) this.vy = -this.vy;

                // Mouse interaction
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        this.x += Math.cos(angle) * force * 1.5;
                        this.y += Math.sin(angle) * force * 1.5;
                    }
                }
            }
        }

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        // Draw connections
        const connectParticles = () => {
            const maxDistance = 120;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < maxDistance) {
                        const alpha = (1 - dist / maxDistance) * 0.35;
                        ctx.strokeStyle = theme === 'dark'
                            ? `rgba(167, 139, 250, ${alpha})`
                            : `rgba(99, 102, 241, ${alpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // Animation Loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connectParticles();
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(contactStore.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPhoneInput('');
                setFormSuccessMessage(__('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.'));
                setTimeout(() => setFormSuccessMessage(''), 5000);
            }
        });
    };

    // Filter projects
    const filteredProjects = activeFilter === 'All'
        ? projects
        : projects.filter(p => p.category.toLowerCase() === activeFilter.toLowerCase());

    // Project Categories
    const categories = ['All', 'Frontend', 'Backend', 'Fullstack'];

    // Generate clean meta description and keywords for SEO
    const metaDescription = about?.hero_subtitle || 'Portafolio Profesional de Desarrollador Web Full Stack. Construyendo aplicaciones web de alto rendimiento, optimizadas y con un diseño estético de primer nivel.';
    const metaKeywords = 'Theizer Gonzalez, Desarrollador Web, Full Stack Developer, Laravel, React, PHP, JavaScript, Portafolio, Programador, SEO';
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://theizerdev.com';
    const authorName = about?.hero_title || 'Theizer Gonzalez';
    const avatarUrl = about?.avatar_path ? `${siteUrl}${about.avatar_path}` : '';

    return (
        <>
            <Head>
                <title>{about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'}</title>
                <meta name="description" content={metaDescription} />
                <meta name="keywords" content={metaKeywords} />
                <meta name="author" content={authorName} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={siteUrl} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={siteUrl} />
                <meta property="og:title" content={about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'} />
                <meta property="og:description" content={metaDescription} />
                {avatarUrl && <meta property="og:image" content={avatarUrl} />}

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={siteUrl} />
                <meta name="twitter:title" content={about?.hero_title ? `Portafolio Profesional | ${about.hero_title}` : 'Portafolio Profesional | Theizer Gonzalez'} />
                <meta name="twitter:description" content={metaDescription} />
                {avatarUrl && <meta name="twitter:image" content={avatarUrl} />}
            </Head>

            {/* Custom Interactive Cursor */}
            <div
                ref={cursorRef}
                className={`hidden md:block fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out ${cursorHovered
                    ? 'w-12 h-12 bg-indigo-500/20 border border-indigo-400 scale-100'
                    : 'w-4 h-4 bg-indigo-600 dark:bg-indigo-400 scale-100'
                    }`}
                style={{ left: '-100px', top: '-100px' }}
            />

            {/* Custom Blobs Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float-blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: float-blob 20s infinite ease-in-out;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes blink-cursor {
                    50% { border-color: transparent; }
                }
                .animate-blink {
                    animation: blink-cursor 0.75s step-end infinite;
                }
                .swiper-wrapper-linear .swiper-wrapper {
                    transition-timing-function: linear !important;
                }
            `}} />

            {/* Particle Background */}
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />

            <div className="relative z-10 min-h-screen text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/70 transition-colors duration-500 font-sans antialiased selection:bg-indigo-500 selection:text-white">
                {/* Glow Blobs ambient background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[15%] left-[5%] w-80 h-80 rounded-full blur-3xl bg-indigo-500/10 dark:bg-indigo-600/5 animate-blob" />
                    <div className="absolute top-[40%] right-[5%] w-96 h-96 rounded-full blur-3xl bg-purple-500/10 dark:bg-purple-600/5 animate-blob animation-delay-2000" />
                    <div className="absolute bottom-[20%] left-[8%] w-80 h-80 rounded-full blur-3xl bg-pink-500/10 dark:bg-pink-600/5 animate-blob animation-delay-4000" />
                </div>

                {/* Navbar */}
                <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/60 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <a href="#" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-85 transition-opacity">
                            Theizer.dev
                        </a>

                        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{__('Sobre Mí')}</a>
                            <a href="#skills" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{__('Habilidades')}</a>
                            <a href="#projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{__('Proyectos')}</a>
                            <a href="#experience" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{__('Experiencia')}</a>
                            <a href="#contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{__('Contacto')}</a>
                        </nav>

                        <div className="flex items-center space-x-4">
                            {/* Language Toggle */}
                            <LanguageToggle />

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                aria-label={__('Cambiar Tema')}
                            >
                                {theme === 'dark' ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M6.343 17.657L5.636 18.364m12.728-12.728L17.657 6.343M12 5a7 7 0 100 14 7 7 0 000-14z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            {/* Admin Link */}
                            {auth.user ? (
                                <Link
                                    href={dashboard().url}
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition shadow-lg shadow-indigo-600/20"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login().url}
                                    className="px-4 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition"
                                >
                                    Login
                                </Link>
                            )}

                            {/* Mobile Hamburger Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
                                aria-label={__('Toggle Menu')}
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                </header>

                {/* Off-canvas Mobile Menu */}
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
                                {[
                                    { id: 'about', label: 'Sobre Mí' },
                                    { id: 'skills', label: 'Habilidades' },
                                    { id: 'projects', label: 'Proyectos' },
                                    { id: 'experience', label: 'Experiencia' },
                                    { id: 'contact', label: 'Contacto' },
                                ].map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-sm font-semibold text-slate-700 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-950/30"
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
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login().url}
                                    className="flex items-center justify-center w-full py-3 text-sm font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-slate-750 dark:text-slate-350 transition-all"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 overflow-hidden">
                    <div className="max-w-4xl text-center z-10 space-y-8">
                        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 rounded-full uppercase">
                            {about?.hero_badge || __('Disponible para Proyectos')}
                        </span>

                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
                            {__('Hola, soy')} <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{about?.hero_title || 'Theizer Gonzalez'}</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed min-h-[4rem] sm:min-h-0">
                            {__('Desarrollador Web Full Stack apasionado por construir')} <Typewriter phrases={[
                                __('aplicaciones interactivas y eficientes.'),
                                __('interfaces modernas y fluidas.'),
                                __('soluciones web con diseño premium.'),
                                __('arquitecturas escalables e intuitivas.')
                            ]} />
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="#projects"
                                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 dark:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                            >
                                {__('Ver Proyectos')}
                            </a>
                            <a
                                href="#contact"
                                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all hover:-translate-y-0.5"
                            >
                                {__('Contactar')}
                            </a>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </section>

                {/* About Section */}
                <section id="about" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
                    <ScrollReveal>
                        <div className="grid md:grid-cols-12 gap-12 items-center">
                            <div className="md:col-span-5 flex justify-center">
                                <div className="relative group">
                                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                    <div className="relative w-64 h-80 md:w-80 md:h-[400px] rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
                                        {(about && about.avatar_path) ? (
                                            <img
                                                src={about.avatar_path}
                                                alt="Avatar de perfil"
                                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            /* SVG Profile Avatar */
                                            <svg viewBox="0 0 200 200" className="w-48 h-48 text-indigo-500">
                                                <defs>
                                                    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#4f46e5" />
                                                        <stop offset="100%" stopColor="#8b5cf6" />
                                                    </linearGradient>
                                                </defs>
                                                <circle cx="100" cy="100" r="80" fill="url(#avatarGrad)" opacity="0.15" />
                                                <path d="M100 50 C 115 50, 125 60, 125 75 C 125 90, 115 100, 100 100 C 85 100, 75 90, 75 75 C 75 60, 85 50, 100 50 Z" fill="url(#avatarGrad)" />
                                                <path d="M50 150 C 50 120, 70 110, 100 110 C 130 110, 150 120, 150 150 Z" fill="url(#avatarGrad)" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-7 space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{__('Sobre Mí')}</h2>
                                <div
                                    className="text-slate-600 dark:text-slate-400 font-light leading-relaxed prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: about && about.bio ? about.bio : __('Completa tu biografía profesional en el panel de administración.')
                                    }}
                                />

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {about ? (about.experience_years.toString().toLowerCase().includes('año') || about.experience_years.toString().toLowerCase().includes('year') ? __(about.experience_years) : `${about.experience_years} ${__('Años')}`) : __('0 Años')}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{__('Experiencia Profesional')}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {about ? (about.completed_projects.toString().toLowerCase().includes('proyecto') || about.completed_projects.toString().toLowerCase().includes('project') ? __(about.completed_projects) : `${about.completed_projects} ${__('Proyectos')}`) : __('0 Proyectos')}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{__('Entregados con Éxito')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* Skills Section */}
                <section id="skills" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50 scroll-mt-16">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center space-y-3 mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">{__('Habilidades y Tecnologías')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-light">{__('Mi arsenal técnico para dar vida a ideas innovadoras.')}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {Object.keys(skills).map((category, catIdx) => (
                                <ScrollReveal key={category} delay={catIdx * 150}>
                                    <GlowCard className="p-6">
                                        <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider text-xs mb-6">
                                            {__(category)}
                                        </h3>
                                        <div className="space-y-4">
                                            {skills[category].map((skill) => (
                                                <div key={skill.id} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{skill.name}</span>
                                                        <span className="text-slate-500 dark:text-slate-400">{skill.proficiency}%</span>
                                                    </div>
                                                    <SkillBar proficiency={skill.proficiency} />
                                                </div>
                                            ))}
                                        </div>
                                    </GlowCard>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Projects Section */}
                <section id="projects" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tight">{__('Proyectos Destacados')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-light">{__('Una selección de mis últimos desarrollos y trabajos representativos.')}</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center overflow-x-auto space-x-2 pb-2 md:pb-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFilter(cat)}
                                    className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${activeFilter === cat
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {__(cat)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Projects Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project, pIdx) => (
                                <ScrollReveal key={project.id} delay={pIdx * 100}>
                                    <GlowCard className="group hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                        {/* Image / Thumbnail Container */}
                                        <div className="relative aspect-video bg-gradient-to-br from-indigo-900/20 to-purple-900/20 dark:from-indigo-950/50 dark:to-purple-950/50 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                                            {project.image_path ? (
                                                <img
                                                    src={project.image_path}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                /* Beautiful SVG Gradient Placeholder */
                                                <svg className="w-16 h-16 text-indigo-500/50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                            )}

                                            {project.is_featured ? (
                                                <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold text-white bg-indigo-600 rounded-full uppercase tracking-wider">
                                                    {__('Destacado')}
                                                </span>
                                            ) : null}

                                            <span className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full uppercase tracking-wider">
                                                {__(project.category)}
                                            </span>
                                        </div>

                                        {/* Content Container */}
                                        <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {project.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed line-clamp-3">
                                                    {project.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center space-x-3 pt-2">
                                                {project.live_url ? (
                                                    <a
                                                        href={project.live_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                                                    >
                                                        {__('Demo En Vivo')}
                                                        <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                ) : null}
                                                {project.github_url ? (
                                                    <a
                                                        href={project.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        {__('Ver Código')}
                                                        <svg className="w-3.5 h-3.5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" />
                                                        </svg>
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    </GlowCard>
                                </ScrollReveal>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                {__('No hay proyectos cargados en esta categoría.')}
                            </div>
                        )}
                    </div>
                </section>

                {/* Clientes Actuales Section */}
                {clients && clients.length > 0 && (
                    <section id="clients" className="py-16 bg-slate-100/30 dark:bg-slate-900/10 border-b border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="text-center space-y-2 mb-10">
                                <h2 className="text-xs font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                                    {__('Clientes Actuales')}
                                </h2>
                                <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                                    {__('Marcas y Empresas que Confían en Mí')}
                                </p>
                            </div>

                            <div className="swiper-wrapper-linear pointer-events-none md:pointer-events-auto">
                                <Swiper
                                    modules={[Autoplay]}
                                    spaceBetween={20}
                                    slidesPerView={2}
                                    loop={true}
                                    speed={4000}
                                    autoplay={{
                                        delay: 0,
                                        disableOnInteraction: false,
                                        pauseOnMouseEnter: true,
                                    }}
                                    breakpoints={{
                                        480: { slidesPerView: 3, spaceBetween: 30 },
                                        768: { slidesPerView: 4, spaceBetween: 40 },
                                        1024: { slidesPerView: 5, spaceBetween: 50 },
                                        1280: { slidesPerView: 6, spaceBetween: 60 },
                                    }}
                                    className="py-4"
                                >
                                    {duplicatedClients.map((client, idx) => (
                                        <SwiperSlide key={`${client.id}-${idx}`} className="flex items-center justify-center">
                                            <a
                                                href={client.website_url || '#'}
                                                target={client.website_url ? "_blank" : undefined}
                                                rel={client.website_url ? "noopener noreferrer" : undefined}
                                                className={`w-full h-20 flex items-center justify-center p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-300 ${client.website_url ? 'cursor-pointer' : 'cursor-default'
                                                    }`}
                                            >
                                                {client.logo_path ? (
                                                    <img
                                                        src={client.logo_path}
                                                        alt={client.name}
                                                        className="max-h-12 max-w-full object-contain filter grayscale opacity-60 dark:opacity-40 hover:grayscale-0 hover:opacity-100 dark:hover:opacity-100 transition-all duration-300"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-sm tracking-wider text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase">
                                                        {client.name}
                                                    </span>
                                                )}
                                            </a>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>
                    </section>
                )}

                {/* Experience Section */}
                <section id="experience" className="py-24 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50 scroll-mt-16">
                    <div className="max-w-3xl mx-auto px-6">
                        <div className="text-center space-y-3 mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">{__('Experiencia Laboral')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-light">{__('Mi recorrido profesional en empresas y proyectos freelance.')}</p>
                        </div>

                        <div className="relative border-l border-slate-200 dark:border-slate-800 space-y-12 pl-6 ml-4">
                            {experiences.map((exp, expIdx) => (
                                <ScrollReveal key={exp.id} delay={expIdx * 120}>
                                    <div className="relative group">

                                        {/* Interactive Bullet */}
                                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white dark:bg-slate-950 border-2 border-indigo-600 dark:border-indigo-400 rounded-full group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-colors" />

                                        <div className="space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                <h3 className="text-lg font-bold">{exp.role}</h3>
                                                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 rounded-md self-start sm:self-auto">
                                                    {exp.start_date} – {exp.is_current ? __('Presente') : exp.end_date}
                                                </span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{exp.company}</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed whitespace-pre-line">
                                                {exp.description}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-24 max-w-xl mx-auto px-6 scroll-mt-16">
                    <ScrollReveal>
                        <div className="text-center space-y-3 mb-12">
                            <h2 className="text-3xl font-bold tracking-tight">{__('Ponte En Contacto')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 font-light">{__('¿Tienes un proyecto en mente? Escríbeme y hagámoslo realidad.')}</p>
                        </div>

                        {formSuccessMessage && (
                            <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400 animate-fade-in">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formSuccessMessage}</span>
                            </div>
                        )}

                        {(() => {
                            const calculateCompleteness = () => {
                                let completed = 0;
                                if (data.name.trim().length > 0) completed++;
                                if (data.email.trim().length > 0 && data.email.includes('@')) completed++;
                                if (data.message.trim().length > 0) completed++;
                                return Math.round((completed / 3) * 100);
                            };
                            const completeness = calculateCompleteness();
                            return (
                                <div className="space-y-1.5 mb-6">
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                        <span>{__('Completitud del mensaje')}</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">{completeness}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${completeness === 100
                                                    ? 'bg-emerald-500'
                                                    : completeness >= 66
                                                        ? 'bg-indigo-500'
                                                        : 'bg-indigo-400/50'
                                                }`}
                                            style={{ width: `${completeness}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Nombre')}</label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                    />
                                    {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Correo Electrónico')}</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                    />
                                    {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                                </div>
                            </div>

                            {/* Campo de Teléfono con Selector de Código de País y Buscador */}
                            <div className="space-y-2 relative">
                                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Número Telefónico (Opcional)')}</label>

                                <div className="relative flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 overflow-visible transition-all">
                                    {/* Selector del Código de País */}
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center space-x-1.5 px-3 py-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-l-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-sm"
                                    >
                                        <span>{selectedCountry.flag}</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedCountry.code}</span>
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Input del Número de Teléfono */}
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phoneInput}
                                        onChange={handlePhoneChange}
                                        placeholder="4241703465"
                                        className="flex-grow px-4 py-3 bg-transparent border-0 focus:ring-0 text-sm placeholder-slate-450 dark:placeholder-slate-500"
                                    />

                                    {/* Dropdown con Buscador Rápido */}
                                    {dropdownOpen && (
                                        <>
                                            {/* Overlay para cerrar haciendo clic fuera */}
                                            <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />

                                            {/* Menú Flotante */}
                                            <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-30 overflow-hidden animate-fade-in">
                                                {/* Buscador */}
                                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                                    <input
                                                        type="text"
                                                        placeholder={__('Buscar país...')}
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                                                        autoFocus
                                                    />
                                                </div>

                                                {/* Lista */}
                                                <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-slate-100 dark:divide-slate-800">
                                                    {filteredCountries.map(c => (
                                                        <li key={c.name + c.code}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectCountry(c)}
                                                                className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between transition-colors"
                                                            >
                                                                <span className="flex items-center space-x-2">
                                                                    <span>{c.flag}</span>
                                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                                                                </span>
                                                                <span className="text-slate-500 dark:text-slate-400 font-semibold">{c.code}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                    {filteredCountries.length === 0 && (
                                                        <li className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400">{__('No se encontraron resultados')}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Asunto (Opcional)')}</label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={data.subject}
                                    onChange={e => setData('subject', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                                />
                                {errors.subject && <div className="text-xs text-red-500 mt-1">{errors.subject}</div>}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Mensaje')}</label>
                                <textarea
                                    id="message"
                                    required
                                    rows={5}
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all resize-none"
                                />
                                {errors.message && <div className="text-xs text-red-500 mt-1">{errors.message}</div>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {processing ? __('Enviando...') : __('Enviar mensaje')}
                            </button>
                        </form>
                    </ScrollReveal>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <div>
                            &copy; {new Date().getFullYear()} Theizer Gonzalez. {__('Todos los derechos reservados.')}
                        </div>
                        <div className="flex items-center space-x-6">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                GitHub
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
