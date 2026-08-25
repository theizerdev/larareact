import { Head, Link, usePage } from '@inertiajs/react';
import {
    Zap,
    Smartphone,
    ShieldCheck,
    Coins,
    Package,
    Wallet,
    CheckCircle2,
    ArrowRight,
    ChevronRight,
    Sparkles,
    Laptop,
    ChevronDown,
    Check,
    Lock,
    Send,
    MessageSquare,
    Building2,
    User,
    Phone,
    Mail,
    Clock,
    Loader2,
    Star,
    Quote,
    TrendingUp,
    FileSpreadsheet,
    Calculator,
    Scale,
    BookOpen,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import BackgroundParticles from '@/components/background-particles';
import PagePreloader from '@/components/page-preloader';

export default function Welcome() {
    const pageProps = usePage().props as any;
    const auth = pageProps.auth || {};
    const { __ } = useTranslate();

    // Detección dinámica de país (Venezuela vs Internacional)
    const isVenezuela = Boolean(pageProps.isVenezuela);
    const countryCode = pageProps.countryCode || 'MX';
    const currencySymbol = pageProps.currencySymbol || '$';
    const currencyCode = pageProps.currencyCode || 'MXN';

    const countryOptions = [
        { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
        { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
        { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
        { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
        { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
        { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
        { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
        { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
        { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
        { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
        { code: 'DO', name: 'Rep. Dominicana', dialCode: '+1-809', flag: '🇩🇴' },
    ];

    const defaultDial = isVenezuela ? '+58' : (countryOptions.find(c => c.code === countryCode)?.dialCode || '+52');

    const [activeFaq, setActiveFaq] = useState<number | null>(0);
    const [contactForm, setContactForm] = useState({
        name: '',
        business: '',
        countryDial: defaultDial,
        phone: '',
        message: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitFeedback(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/contact-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    name: contactForm.name,
                    business: contactForm.business,
                    country_dial: contactForm.countryDial,
                    phone: contactForm.phone,
                    message: contactForm.message,
                }),
            });

            const data = await res.json();

            if (res.ok && data?.success) {
                setSubmitFeedback({
                    type: 'success',
                    message: data.message || __('¡Gracias por contactarnos! Tu mensaje ha sido enviado exitosamente.'),
                });
                setContactForm({
                    name: '',
                    business: '',
                    countryDial: defaultDial,
                    phone: '',
                    message: '',
                });
            } else {
                setSubmitFeedback({
                    type: 'error',
                    message: data?.message || __('Ocurrió un problema al enviar tu mensaje. Por favor intenta de nuevo.'),
                });
            }
        } catch (err: any) {
            setSubmitFeedback({
                type: 'error',
                message: __('Ocurrió un problema al enviar tu mensaje. Por favor intenta de nuevo.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>{__('FixSale | Punto de Venta, Inventario y Automatización WhatsApp')}</title>
                <meta name="description" content={__('Plataforma integral de Punto de Venta (POS), Control de Inventario, Gestión de Servicio Técnico y Automatización por WhatsApp. Potencia la gestión y ventas de tu empresa.')} />
                <meta name="keywords" content="FixSale, SERVITEC, punto de venta, pos, inventario, servicio tecnico, taller, whatsapp automatizacion, facturacion, gestion comercial" />
                <meta property="og:title" content={__('FixSale | Punto de Venta, Inventario y Automatización WhatsApp')} />
                <meta property="og:description" content={__('Plataforma integral de Punto de Venta (POS), Control de Inventario, Gestión de Servicio Técnico y Automatización por WhatsApp.')} />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="/image/logo/2.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={__('FixSale | Punto de Venta, Inventario y Automatización WhatsApp')} />
                <meta name="twitter:description" content={__('Plataforma integral de Punto de Venta (POS), Control de Inventario, Gestión de Servicio Técnico y Automatización por WhatsApp.')} />
                <meta name="twitter:image" content="/image/logo/2.png" />
            </Head>

            {/* ─── PRELOADER CON ISOTIPO MINI FIXSALE (2.PNG) ────────────────────────── */}
            <PagePreloader logoPath="/image/logo/2.png" durationMs={1100} slogan={__('Controla. Vende. Crece.')} />

            <div className="relative min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white antialiased overflow-x-hidden">
                {/* ─── CANVASES & PARTICLES DECORATION ──────────────────────────────────── */}
                <BackgroundParticles particleCount={40} colorScheme="brand" />

                {/* ─── SOFT BACKGROUND DECORATIONS (LIGHT MODE) ────────────────────────────── */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-orange-500/5 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
                <div className="fixed top-1/3 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />
                <div className="fixed bottom-10 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] pointer-events-none -z-10" />

                {/* ─── HEADER / NAVBAR ────────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-sm transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                        {/* Logo Horizontal Completo FixSale (Light Mode) */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/image/logo/5.png"
                                alt="FixSale Logo"
                                className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>

                        {/* Menú Nav Desktop */}
                        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                            <a href="#pos" className="hover:text-[#ff5a00] transition-colors">
                                {__('Punto de Venta')}
                            </a>
                            <a href="#whatsapp" className="hover:text-[#ff5a00] transition-colors">
                                {__('WhatsApp Engine')}
                            </a>
                            <a href="#features" className="hover:text-[#ff5a00] transition-colors">
                                {__('Características')}
                            </a>
                            <a href="#pricing" className="hover:text-[#ff5a00] transition-colors">
                                {__('Planes')}
                            </a>
                            <a href="#testimonials" className="hover:text-[#ff5a00] transition-colors">
                                {__('Testimonios')}
                            </a>
                            <a href="#faq" className="hover:text-[#ff5a00] transition-colors">
                                {__('FAQ')}
                            </a>
                        </nav>

                        {/* Acciones de Auth */}
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href="/admin/dashboard"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#08264e] hover:bg-[#061e3d] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <Laptop className="w-4 h-4" />
                                    {__('Ir al Dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#08264e] transition-colors"
                                    >
                                        {__('Iniciar Sesión')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-95"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {__('Probar 7 Días Gratis')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ─── HERO SECTION ───────────────────────────────────────────────────────── */}
                <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                        {/* Badge dinámico por País */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-[#ff5a00] shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-[#ff5a00]" />
                            <span>
                                {isVenezuela
                                    ? __('Novedad: Sincronización Tasa Oficial BCV & WhatsApp Engine')
                                    : __('Novedad: Punto de Venta Ultrarrápido & WhatsApp Engine Integrado')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </div>

                        {/* Titular Principal H1 */}
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#08264e] tracking-tight max-w-5xl mx-auto leading-[1.15]">
                            {__('El Punto de Venta')} <br />
                            <span className="bg-gradient-to-r from-[#ff5a00] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                {__('que Hace Crecer tu Negocio')}
                            </span>
                        </h1>

                        {/* Subtítulo */}
                        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
                            {__('Procesa ventas en segundos, automatiza recibos por WhatsApp, controla tu Contabilidad completa (Diario, Mayor, P&L, Impuestos, Excel 10 Pestañas) y gestiona tus divisas en tiempo real.')}
                        </p>

                        {/* Botones CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <span>{__('Comenzar Prueba Gratuita (7 Días)')}</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="#pos"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-[#08264e] font-bold text-base shadow-sm transition-all hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 text-[#ff5a00]" />
                                <span>{__('Ver Características')}</span>
                            </a>
                        </div>

                        {/* Garantía */}
                        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-2">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Sin tarjeta de crédito')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Configuración en 2 minutos')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Soporte incluido')}
                            </span>
                        </div>

                        {/* SCREENSHOT REAL MEJORADO DEL DASHBOARD FIXSALE */}
                        <div id="pos" className="pt-8 max-w-6xl mx-auto relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#08264e] via-[#ff5a00] to-[#08264e] rounded-3xl blur-2xl opacity-20 group-hover:opacity-35 transition-all duration-500" />
                            <div className="relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl text-left">
                                {/* Barra superior de ventana estilo navegador */}
                                <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/90 shadow-sm" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-sm" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm" />
                                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md ml-3 shadow-inner">
                                            <span className="text-emerald-500">🔒</span>
                                            <span>https://app.fixsale.app/admin/dashboard</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium">
                                        {/* Estado WhatsApp Engine */}
                                        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 font-bold shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            WhatsApp Active
                                        </span>

                                        {/* Tasa BCV o Multimoneda */}
                                        <span className="bg-white px-3 py-1 rounded-full text-slate-700 font-mono font-bold border border-slate-200 shadow-sm">
                                            {isVenezuela ? '💵 Tasa BCV: 36.50 Bs' : `💵 Divisa: ${currencyCode} (${currencySymbol})`}
                                        </span>
                                    </div>
                                </div>

                                {/* Contenedor de la Imagen del Dashboard Real */}
                                <div className="relative bg-slate-950 overflow-hidden">
                                    <img
                                        src="/image/dashboard-preview.png"
                                        alt={__('Panel de Control y Analíticas en Vivo de FixSale')}
                                        className="w-full h-auto object-cover rounded-b-xl shadow-inner transition-transform duration-700 group-hover:scale-[1.008]"
                                        loading="eager"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── BANNER DE STATS Y PERFORMANCE ────────────────────────────────────── */}
                <section className="py-12 border-y border-slate-200 bg-white shadow-inner">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#ff5a00] font-mono">3x</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Más veloz en caja registradora')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#08264e] font-mono">100%</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Control de arqueo por usuario')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">WhatsApp</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Notificaciones & credenciales automáticas')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#ff5a00] font-mono">7 {__('Días')}</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Prueba gratuita completa')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN DE CARACTERÍSTICAS PRINCIPALES ─────────────────────────────── */}
                <section id="features" className="py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                                {__('Módulos Potentes')}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#08264e] tracking-tight">
                                {__('Diseñado para resolver los desafíos reales de tu negocio')}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg">
                                {__('Cada herramienta está optimizada para acelerar las operaciones diarias, evitar descuidos de dinero y conectar a tu equipo.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Card 1: POS */}
                            <div className="bg-white border border-slate-200 hover:border-orange-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5a00] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Punto de Venta Eleventa / POS')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Ventas ágiles con teclado físico (F4-F12), escáner predictivo, artículos varios e impresión directa en ticketera térmica.')}
                                </p>
                            </div>

                            {/* Card 2: WhatsApp */}
                            <div id="whatsapp" className="bg-white border border-slate-200 hover:border-emerald-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('WhatsApp Engine Integrado')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Envío automático de mensajes de bienvenida con credenciales claras (Email, Usuario, Password) y comprobantes de compra.')}
                                </p>
                            </div>

                            {/* Card 3: Arqueo de Caja */}
                            <div className="bg-white border border-slate-200 hover:border-blue-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#08264e] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Arqueo Estricto por Aperturador')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Seguridad financiera garantizada: Únicamente el usuario que realiza la apertura de caja puede efectuar el Cierre Z del turno.')}
                                </p>
                            </div>

                            {/* Card 4: Multimoneda / BCV */}
                            <div className="bg-white border border-slate-200 hover:border-amber-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">
                                    {isVenezuela ? __('Tasa Oficial BCV & Divisas') : __('Multimoneda & Conversión Dinámica')}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {isVenezuela
                                        ? __('Consulta y actualización automática de la tasa oficial del Banco Central de Venezuela (BCV) en dólares y bolívares.')
                                        : __('Gestión de múltiples monedas y tipo de cambio configurable en tiempo real para cotizar y cobrar sin errores.')}
                                </p>
                            </div>

                            {/* Card 5: Inventario */}
                            <div className="bg-white border border-slate-200 hover:border-orange-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5a00] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Inventario & Alertas de Stock')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Control de existencias mínimas, compras a proveedores, categorías, marcas y servicios de reparación.')}
                                </p>
                            </div>

                            {/* Card 6: Ventas a Crédito */}
                            <div className="bg-white border border-slate-200 hover:border-emerald-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Ventas a Crédito y Cobranza')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Gestión de límites de crédito por cliente, registro de abonos y cuentas por cobrar con impacto directo en caja.')}
                                </p>
                            </div>

                            {/* Card 7: Contabilidad Completa & Libros Fiscales */}
                            <div className="bg-white border border-slate-200 hover:border-purple-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Contabilidad & Libros Fiscales')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Plan de Cuentas, Libro Diario, Libro Mayor, Balance General, P&L, Libros IVA/IGTF y exportación Excel (.xlsx) de 10 pestañas.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SIMULADOR INTERACTIVO DE WHATSAPP ─────────────────────────────────── */}
                <section className="py-20 bg-white border-y border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Texto Explicativo */}
                            <div className="space-y-6 text-left">
                                <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                                    {__('Comunicación Automática')}
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#08264e] tracking-tight leading-tight">
                                    {__('Tus usuarios y clientes informados al instante por WhatsApp')}
                                </h2>
                                <p className="text-slate-600 text-base leading-relaxed">
                                    {__('Al crear un nuevo usuario desde el panel de administración, el sistema envía un mensaje de bienvenida limpio, profesional y formateado con sus credenciales de acceso.')}
                                </p>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Formateo de teléfono automático con código internacional de país.')}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Envío de usuario, correo, contraseña y enlace directo de login.')}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Verificación OTP de 8 dígitos para inicio de sesión seguro.')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simulación Teléfono Móvil WhatsApp */}
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm bg-slate-900 border-8 border-slate-800 rounded-[40px] shadow-2xl p-3 overflow-hidden relative font-sans text-left">
                                    {/* Muesca del teléfono */}
                                    <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-3" />

                                    {/* Header WhatsApp Chat */}
                                    <div className="bg-emerald-700 text-white p-3 rounded-t-2xl flex items-center gap-3 shadow">
                                        <img
                                            src="/image/logo/2.png"
                                            alt="Isotipo FixSale"
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white bg-white"
                                        />
                                        <div>
                                            <p className="font-bold text-sm">FixSale POS System</p>
                                            <p className="text-[10px] text-emerald-200 font-mono">WhatsApp Verified Account</p>
                                        </div>
                                    </div>

                                    {/* Burbuja de Mensaje WhatsApp */}
                                    <div className="bg-[#e5ddd5] p-4 rounded-b-2xl space-y-3">
                                        <div className="bg-white text-slate-800 p-3.5 rounded-2xl rounded-tl-none text-xs space-y-2 font-mono shadow-sm">
                                            <p className="font-bold text-emerald-700">🌟 ¡Bienvenido(a) a FixSale! 🌟</p>
                                            <p>Hola <span className="font-bold text-slate-900">Juan Pérez</span>, nos alegra darte la bienvenida a nuestra plataforma.</p>
                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                                                <p>🔑 <span className="font-bold text-[#08264e]">Credenciales de Acceso:</span></p>
                                                <p>👤 Nombre: Juan Pérez</p>
                                                <p>📧 Correo: jperez@empresa.com</p>
                                                <p>🏷️ Usuario: jperez</p>
                                                <p>🔒 Contraseña: ********</p>
                                                <p>🏢 Empresa: Demo Store S.A.</p>
                                            </div>
                                            <p className="text-emerald-700 underline font-bold">🌐 http://fixsale.app/login</p>
                                            <span className="text-[9px] text-slate-400 text-right block pt-1">10:45 AM ✓✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN DE PRECIOS & PLANES COMPLETA ─────────────────────────────── */}
                <section id="pricing" className="py-20 md:py-28 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        {/* Encabezado de la Sección */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full shadow-sm">
                                {__('Planes & Precios Transparentes')}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#08264e] tracking-tight leading-tight">
                                {__('Elige el plan ideal para impulsar tu negocio')}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg">
                                {__('Sin sorpresas ni contratos forzosos. Todos los planes incluyen 7 días de prueba gratuita sin requerir tarjeta de crédito.')}
                            </p>
                        </div>

                        {/* Grid de 4 Planes Dinámico desde Base de Datos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
                            {((pageProps.planes && pageProps.planes.length > 0)
                                ? pageProps.planes.filter((p: any) => p.activo !== false)
                                : [
                                    {
                                        id: 1,
                                        nombre: 'Plan Prueba',
                                        descripcion: '7 días de acceso completo para evaluar todas las herramientas.',
                                        precio_regular_mensual: 0,
                                        precio_promocional_mensual: 0,
                                        tiene_promocion: false,
                                        sucursales_incluidas: 1,
                                    },
                                    {
                                        id: 2,
                                        nombre: 'Plan Básico',
                                        descripcion: 'Ideal para emprendedores y comercios que inician.',
                                        precio_regular_mensual: 399,
                                        precio_promocional_mensual: 299,
                                        tiene_promocion: true,
                                        badge_promocion: '25% DTO Promo',
                                        sucursales_incluidas: 1,
                                    },
                                    {
                                        id: 3,
                                        nombre: 'Plan Profesional',
                                        descripcion: 'Control operativo total y reportes avanzados.',
                                        precio_regular_mensual: 599,
                                        precio_promocional_mensual: 499,
                                        tiene_promocion: true,
                                        badge_promocion: 'Más Popular',
                                        destacado: true,
                                        sucursales_incluidas: 1,
                                    },
                                    {
                                        id: 4,
                                        nombre: 'Plan Empresarial',
                                        descripcion: 'Potencia multi-sucursal para empresas consolidadas.',
                                        precio_regular_mensual: 999,
                                        precio_promocional_mensual: 799,
                                        tiene_promocion: true,
                                        badge_promocion: 'Mejor Valor',
                                        sucursales_incluidas: 2,
                                    },
                                ]
                            ).map((plan: any) => {
                                const nameLower = (plan.nombre || '').toLowerCase();
                                const isFree = nameLower.includes('prueba') || (Number(plan.precio_regular_mensual) === 0 && Number(plan.precio_promocional_mensual) === 0 && Number(plan.precio_3_meses) === 0);
                                const isPopular = Boolean(plan.destacado) || nameLower.includes('profesional');
                                const isBestValue = (nameLower.includes('empresarial') || nameLower.includes('anual')) && !isPopular;

                                const precioRegular = Number(plan.precio_regular_mensual) || (Number(plan.precio_3_meses) > 0 ? Math.round(Number(plan.precio_3_meses) / 3) : 0);
                                const precioPromo = Number(plan.precio_promocional_mensual) || precioRegular;
                                const tienePromo = Boolean(plan.tiene_promocion) && precioPromo < precioRegular && precioPromo > 0;
                                const porcentajeAhorro = precioRegular > 0 ? Math.round(((precioRegular - precioPromo) / precioRegular) * 100) : 0;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`bg-white p-6 sm:p-7 rounded-3xl space-y-6 flex flex-col justify-between transition-all relative ${
                                            isPopular
                                                ? 'border-2 border-[#ff5a00] shadow-2xl transform lg:-translate-y-2'
                                                : 'border border-slate-200 shadow-sm hover:shadow-xl'
                                        }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#ff5a00] to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md shrink-0 whitespace-nowrap">
                                                {__('⭐ 🔥 ¡MÁS RECOMENDADO!')}
                                            </div>
                                        )}
                                        {isBestValue && !isPopular && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md shrink-0 whitespace-nowrap">
                                                {__('🚀 💰 ¡MEJOR PRECIO!')}
                                            </div>
                                        )}

                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    isFree
                                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                        : isPopular
                                                            ? 'bg-orange-50 border border-orange-200 text-[#ff5a00]'
                                                            : isBestValue
                                                                ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                                                : 'bg-blue-50 border border-blue-200 text-[#08264e]'
                                                }`}>
                                                    {isFree ? __('Sin Compromiso') : isPopular ? __('Más Vendido') : isBestValue ? __('Empresarial') : __('Básico')}
                                                </span>

                                                {tienePromo && (
                                                    <span className="bg-red-500/10 text-red-600 text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-red-500/20">
                                                        -{porcentajeAhorro}% OFF
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-black text-[#08264e]">{__(plan.nombre)}</h3>
                                                {plan.descripcion && (
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{__(plan.descripcion)}</p>
                                                )}
                                            </div>

                                            {/* Precios Mensuales */}
                                            <div className="pt-2">
                                                {isFree ? (
                                                    <div>
                                                        <span className="text-4xl font-black text-[#08264e] font-mono">$0</span>
                                                        <span className="text-xs font-extrabold text-slate-500 uppercase ml-1">MXN / 7 {__('Días')}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {tienePromo && (
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className="text-xs font-bold text-slate-400 line-through">
                                                                    ${precioRegular} MXN
                                                                </span>
                                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                                                    {plan.badge_promocion || __('Oferta Especial')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-4xl font-black text-[#08264e] font-mono">
                                                                ${tienePromo ? precioPromo : precioRegular}
                                                            </span>
                                                            <span className="text-xs font-extrabold text-slate-500 font-mono uppercase">
                                                                MXN / {__('mes')}
                                                            </span>
                                                        </div>

                                                        {/* Desglose de cobro mensual transparente */}
                                                        {tienePromo ? (
                                                            <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 border border-slate-100 p-2 rounded-lg leading-relaxed">
                                                                {__('Facturación mensual con precio de oferta')} <strong>${precioPromo} MXN/mes</strong>. {__('Precio regular:')} <strong>${precioRegular} MXN/mes</strong>.
                                                            </p>
                                                        ) : (
                                                            <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                                                {__('Facturación mensual recurrente de')} <strong>${precioRegular} MXN/mes</strong>.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 font-medium">
                                                <li className="flex items-center gap-2 font-semibold text-slate-800">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>{__('Acceso Total al Sistema (Todos los módulos)')}</span>
                                                </li>
                                                <li className="flex items-center gap-2 font-semibold text-slate-800">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>{plan.sucursales_incluidas ?? 1} {__('Sucursal(es) incluida(s)')}</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-slate-700">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>{__('Sucursales adicionales:')} <strong className="text-slate-900">${plan.precio_sucursal_extra_mensual ?? 20} MXN</strong></span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>{__('Soporte técnico y actualizaciones')}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <Link
                                            href={`/register?plan_id=${plan.id}`}
                                            className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-center transition-all block mt-6 ${
                                                isPopular
                                                    ? 'bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25'
                                                    : isFree
                                                        ? 'bg-slate-100 hover:bg-slate-200 text-[#08264e]'
                                                        : 'bg-[#08264e] hover:bg-[#0b3368] text-white'
                                            }`}
                                        >
                                            {isFree ? __('Probar 7 Días Gratis') : `${__('Elegir')} ${__(plan.nombre)}`}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN DE CASOS DE ÉXITO & TESTIMONIOS ────────────────────────────── */}
                <section id="testimonials" className="py-20 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        {/* Encabezado */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="inline-flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-sm">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                {__('Casos de Éxito & Opiniones')}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#08264e] tracking-tight leading-tight">
                                {__('Comercios que impulsan sus ventas con FixSale')}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg">
                                {__('Conoce cómo emprendedores y negocios reales eliminaron descuadres de caja, agilizaron el cobro y optimizaron sus inventarios.')}
                            </p>
                        </div>

                        {/* Grid de Testimonios Dinámico desde Base de Datos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {((pageProps.testimonios && pageProps.testimonios.length > 0)
                                ? pageProps.testimonios
                                : [
                                    {
                                        nombre_cliente: 'Carlos Eduardo Mendoza',
                                        empresa_cargo: 'Gerente General - Mendoza Tech & Repuestos S.A.',
                                        ubicacion: 'Caracas, Venezuela',
                                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                                        comentario: __('Antes perdíamos hasta 2 horas diarias cuadrando la caja en dólares y bolívares al cierre del día. Con FixSale, la tasa BCV se actualiza sola y los cierres Z se realizan en 30 segundos.'),
                                        calificacion: 5,
                                        metrica_destacada: __('Ahorro de 12 hrs/semana en administración'),
                                    },
                                    {
                                        nombre_cliente: 'María Gabriela Rivas',
                                        empresa_cargo: 'Propietaria - Minimarket El Samán',
                                        ubicacion: 'Valencia, Venezuela',
                                        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                                        comentario: __('El punto de venta POS es ultrarrápido. Mis cajeros usan los atajos de teclado y la búsqueda por código de barras sin demoras. La auditoría de caja nos dio 100% de tranquilidad con el inventario.'),
                                        calificacion: 5,
                                        metrica_destacada: __('+35% velocidad en atención al cliente'),
                                    },
                                    {
                                        nombre_cliente: 'Alejandro Torres',
                                        empresa_cargo: 'Fundador - FixMobile Express',
                                        ubicacion: 'Barquisimeto, Venezuela',
                                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                                        comentario: __('Gestionar el inventario, ventas a crédito y recibir las alertas de stock directamente en el sistema nos permitió expandir el negocio. El soporte técnico por WhatsApp responde inmediato.'),
                                        calificacion: 5,
                                        metrica_destacada: __('Expansión a 3 sucursales en 8 meses'),
                                    },
                                ]
                            ).map((item: any, idx: number) => (
                                <div
                                    key={item.id || idx}
                                    className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between space-y-6 relative group"
                                >
                                    <Quote className="w-10 h-10 text-slate-100 absolute top-6 right-6 transition-colors group-hover:text-orange-100 pointer-events-none" />

                                    <div className="space-y-4 relative z-10">
                                        {/* Estrellas */}
                                        <div className="flex items-center gap-1">
                                            {[...Array(item.calificacion || 5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            ))}
                                        </div>

                                        {/* Texto Reseña */}
                                        <p className="text-slate-700 text-sm leading-relaxed italic">
                                            "{item.comentario}"
                                        </p>

                                        {/* Metric Pill */}
                                        {item.metrica_destacada && (
                                            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-800 text-[11px] font-bold">
                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>{item.metrica_destacada}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Perfil Autor */}
                                    <div className="flex items-center gap-3.5 border-t border-slate-100 pt-5 relative z-10">
                                        {item.avatar ? (
                                            <img
                                                src={item.avatar}
                                                alt={item.nombre_cliente}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-[#ff5a00]/30 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-[#08264e] text-white flex items-center justify-center font-bold text-sm border-2 border-[#ff5a00]/30 shadow-sm">
                                                {item.nombre_cliente?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-bold text-[#08264e] leading-snug">{item.nombre_cliente}</h4>
                                            {item.empresa_cargo && <p className="text-xs text-slate-500 font-medium">{item.empresa_cargo}</p>}
                                            {item.ubicacion && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.ubicacion}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── PREGUNTAS FRECUENTES (FAQ) ────────────────────────────────────────── */}
                <section id="faq" className="py-20 border-t border-slate-200 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black text-[#08264e]">{__('Preguntas Frecuentes')}</h2>
                            <p className="text-slate-600 text-sm font-medium">{__('Respuestas a las dudas más comunes sobre la plataforma')}</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: __('¿Cómo funciona la prueba gratuita de 7 días?'),
                                    a: __('Al registrarte obtienes acceso inmediato e ilimitado a todos los módulos del sistema durante 7 días continuos. No requieres ingresar tarjeta de crédito.'),
                                },
                                {
                                    q: __('¿Solo el usuario que abre la caja puede realizar el cierre?'),
                                    a: __('Sí. Por políticas de control y seguridad financiera, únicamente el usuario que realiza la apertura de la caja tiene los permisos para efectuar el Cierre Z de su turno.'),
                                },
                                {
                                    q: isVenezuela
                                        ? __('¿Cómo se consulta la Tasa Oficial del BCV?')
                                        : __('¿Cómo funciona la conversión de monedas?'),
                                    a: isVenezuela
                                        ? __('El sistema consulta en tiempo real la tasa oficial publicada por el Banco Central de Venezuela (BCV), permitiéndote cotizar y cobrar automáticamente en dólares y bolívares.')
                                        : __('Puedes configurar la moneda principal de tu país y utilizar tipos de cambio personalizados en tiempo real.'),
                                },
                                {
                                    q: __('¿Cómo se envían los mensajes por WhatsApp?'),
                                    a: __('El sistema incluye un motor de WhatsApp integrado que puedes conectar escaneando un código QR. Permite enviar credenciales de acceso a nuevos usuarios y comprobantes de compra.'),
                                },
                                {
                                    q: __('¿FixSale incluye módulo de contabilidad y exportación fiscal en Excel?'),
                                    a: __('Sí. Incluye Plan de Cuentas por rubro, Libro Diario, Libro Mayor, Balance General, Estado de Resultados (P&L) y Libros Fiscales de Ventas y Compras con exportación a un único archivo Excel (.xlsx) profesional de 10 pestañas.'),
                                },
                            ].map((faq, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-[#08264e] hover:text-[#ff5a00] transition-colors"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${activeFaq === idx ? 'rotate-180 text-[#ff5a00]' : ''}`} />
                                    </button>
                                    {activeFaq === idx && (
                                        <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN CONTÁCTANOS (FORMULARIO CON SELECTOR DE PAÍS AGRUPADO Y ENVÍO A EMPRESA 1) ───── */}
                <section id="contact" className="py-20 bg-slate-100/70 border-t border-slate-200 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                            {/* Columna Izquierda: Información de Asesoría */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full text-[#08264e] text-xs font-extrabold tracking-wide uppercase shadow-sm">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a00] animate-pulse" />
                                    {__('Atención e Informes')}
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-black text-[#08264e] leading-tight">
                                    {__('¿Tienes dudas o necesitas asesoría personalizada?')}
                                </h2>

                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Escríbenos y un asesor especialista se comunicará contigo a la brevedad para brindarte toda la información y demostración que necesitas.')}
                                </p>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#08264e] flex items-center justify-center shrink-0 font-bold">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#08264e]">{__('Respuesta Ultra-Rápida')}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{__('Atención directa sobre planes, terminales POS e integración de tu negocio.')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#ff5a00] flex items-center justify-center shrink-0 font-bold">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#08264e]">{__('Demostración Guiada')}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{__('Te asesoramos paso a paso en la configuración de divisas, caja y catálogo.')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Formulario con Selector de País Agrupado */}
                            <div className="lg:col-span-7">
                                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h3 className="text-xl font-bold text-[#08264e]">{__('Formulario de Contacto Directo')}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{__('Ingresa tus datos para comunicarte directamente con nuestro equipo de atención.')}</p>
                                    </div>

                                    {submitFeedback && (
                                        <div
                                            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 border ${submitFeedback.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : 'bg-rose-50 text-rose-800 border-rose-200'
                                                }`}
                                        >
                                            <CheckCircle2
                                                className={`w-5 h-5 shrink-0 ${submitFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}
                                            />
                                            <span>{submitFeedback.message}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleContactSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Nombre Completo */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    {__('Tu Nombre')} <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder={__('Ej. Carlos Mendoza')}
                                                        value={contactForm.name}
                                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Nombre del Negocio */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    {__('Nombre de tu Negocio')} <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder={__('Ej. Servitec Tech S.A.')}
                                                        value={contactForm.business}
                                                        onChange={(e) => setContactForm({ ...contactForm, business: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Teléfono de Contacto con Selector de País Agrupado */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {__('Teléfono de Contacto')} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="flex rounded-xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#ff5a00] focus-within:ring-2 focus-within:ring-[#ff5a00]/20 transition-all overflow-hidden">
                                                {/* Selector de País */}
                                                <select
                                                    value={contactForm.countryDial}
                                                    onChange={(e) => setContactForm({ ...contactForm, countryDial: e.target.value })}
                                                    className="bg-slate-100 border-r border-slate-200 text-slate-800 text-xs font-bold px-3 py-2.5 outline-none cursor-pointer hover:bg-slate-200/70 transition-colors shrink-0"
                                                >
                                                    {countryOptions.map((c) => (
                                                        <option key={c.code} value={c.dialCode}>
                                                            {c.flag} {c.code} ({c.dialCode})
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Input de Teléfono */}
                                                <div className="relative flex-1">
                                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                                    <input
                                                        type="tel"
                                                        required
                                                        placeholder={__('412 1234567')}
                                                        value={contactForm.phone}
                                                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent outline-none text-slate-800 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mensaje o Consulta */}
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {__('¿En qué podemos ayudarte?')}
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder={__('Escribe tu mensaje o consulta aquí...')}
                                                value={contactForm.message}
                                                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/20 transition-all outline-none resize-none"
                                            />
                                        </div>

                                        {/* Botón Principal de Enviar Mensaje */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-4 px-6 bg-gradient-to-r from-[#08264e] to-[#0b3368] hover:from-[#0b3368] hover:to-[#08264e] disabled:opacity-60 text-white font-extrabold rounded-2xl shadow-lg shadow-[#08264e]/20 transition-all flex items-center justify-center gap-3 text-base group cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#ff5a00]" />
                                                    <span>{__('Enviando mensaje...')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 text-[#ff5a00]" />
                                                    <span>{__('Enviar Mensaje')}</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER MEJORADO Y COMPLETO ────────────────────────────────────────── */}
                <footer className="border-t border-slate-200 bg-white pt-16 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        {/* Grid Principal del Footer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                            {/* Columna 1: Brand Info & Logo */}
                            <div className="lg:col-span-2 space-y-4">
                                <Link href="/" className="inline-block">
                                    <img
                                        src="/image/logo/5.png"
                                        alt="FixSale Logo"
                                        className="h-12 w-auto object-contain"
                                    />
                                </Link>
                                <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                                    {__('FixSale es el ecosistema inteligente de Punto de Venta, control de caja con auditoría estricta, conversión BCV en tiempo real y automatización por WhatsApp para comercios.')}
                                </p>
                                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit font-bold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>{__('Sistema Operativo & Online 99.9%')}</span>
                                </div>
                            </div>

                            {/* Columna 2: Plataforma & Módulos */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-[#08264e] uppercase tracking-wider font-mono">
                                    {__('Módulos')}
                                </h4>
                                <ul className="space-y-2 text-xs font-medium text-slate-600">
                                    <li><a href="#pos" className="hover:text-[#ff5a00] transition-colors">{__('Terminal POS & Atajos')}</a></li>
                                    <li><a href="#features" className="hover:text-[#ff5a00] transition-colors">{__('Caja Registradora & Cierre Z')}</a></li>
                                    <li><a href="#features" className="hover:text-[#ff5a00] transition-colors">{__('WhatsApp Engine OTP')}</a></li>
                                    <li><a href="#features" className="hover:text-[#ff5a00] transition-colors">{__('Tasa Oficial BCV')}</a></li>
                                </ul>
                            </div>

                            {/* Columna 3: Navegación Rápida */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-[#08264e] uppercase tracking-wider font-mono">
                                    {__('Navegación')}
                                </h4>
                                <ul className="space-y-2 text-xs font-medium text-slate-600">
                                    <li><a href="#hero" className="hover:text-[#ff5a00] transition-colors">{__('Inicio')}</a></li>
                                    <li><a href="#pricing" className="hover:text-[#ff5a00] transition-colors">{__('Planes & Precios')}</a></li>
                                    <li><a href="#faq" className="hover:text-[#ff5a00] transition-colors">{__('Preguntas Frecuentes')}</a></li>
                                    <li><a href="#contact" className="hover:text-[#ff5a00] transition-colors">{__('Contacto Directo')}</a></li>
                                </ul>
                            </div>

                            {/* Columna 4: Accesos & Cuenta */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-[#08264e] uppercase tracking-wider font-mono">
                                    {__('Acceso')}
                                </h4>
                                <div className="space-y-2.5">
                                    <Link
                                        href="/login"
                                        className="block text-center py-2 px-4 bg-slate-100 hover:bg-slate-200 text-[#08264e] font-bold text-xs rounded-xl transition-colors"
                                    >
                                        {__('Iniciar Sesión')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block text-center py-2 px-4 bg-[#ff5a00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all"
                                    >
                                        {__('Prueba Gratis 7 Días')}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Barra Inferior del Footer */}
                        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
                            <p>© {new Date().getFullYear()} FixSale POS. {__('Todos los derechos reservados.')}</p>
                            <div className="flex items-center gap-6">
                                <span className="hover:text-slate-800 transition-colors cursor-pointer">{__('Privacidad')}</span>
                                <span>•</span>
                                <span className="hover:text-slate-800 transition-colors cursor-pointer">{__('Términos del Servicio')}</span>
                                <span>•</span>
                                <span className="hover:text-slate-800 transition-colors cursor-pointer">{__('Seguridad 256-bit SSL')}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
