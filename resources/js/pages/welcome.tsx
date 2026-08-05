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
            <Head title={__('FixSale | Punto de Venta, Inventario y Automatización WhatsApp')} />

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
                            {__('El Punto de Venta e Inventario')} <br />
                            <span className="bg-gradient-to-r from-[#ff5a00] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                {__('que Hace Crecer tu Negocio')}
                            </span>
                        </h1>

                        {/* Subtítulo */}
                        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
                            {__('Procesa ventas en segundos con atajos de teclado, automatiza envíos de credenciales y recibos por WhatsApp, controla cajas con cero descuadres y gestiona tus divisas en tiempo real.')}
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

                        {/* Grid de Planes (4 Tarjetas) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">

                            {/* Plan 1: Prueba Gratis 7 Días */}
                            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative">
                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                                        {__('Sin Compromiso')}
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#08264e]">{__('Prueba Gratuita')}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{__('Evalúa todo el sistema en tu negocio')}</p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#08264e] font-mono">$0</span>
                                            <span className="text-xs font-bold text-slate-500">/ 7 {__('Días')}</span>
                                        </div>
                                        <p className="text-xs text-emerald-600 font-bold mt-1">{__('Acceso Total Ilimitado')}</p>
                                    </div>

                                    <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 font-medium">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Terminal POS con atajos rápidos')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Apertura y Cierre de Caja Z')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{isVenezuela ? __('Tasa BCV en Tiempo Real') : __('Multimoneda & Divisas')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Envíos OTP por WhatsApp')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/register"
                                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#08264e] font-bold text-xs text-center transition-colors block mt-6"
                                >
                                    {__('Probar 7 Días Gratis')}
                                </Link>
                            </div>

                            {/* Plan 2: Trimestral */}
                            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative">
                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#08264e] text-xs font-bold uppercase tracking-wider">
                                        {__('Para Emprendedores')}
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#08264e]">{__('Plan Trimestral')}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{__('Control total para tu primer comercio')}</p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#08264e] font-mono">$29.66</span>
                                            <span className="text-xs font-bold text-slate-500">/ {__('mes')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{__('Facturado $89 cada 3 meses')}</p>
                                    </div>

                                    <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 font-medium">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Todo lo de la Prueba Gratis')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Catálogo y productos ilimitados')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Control de stock e inventario')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Reportes de ventas y ganancias')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/register"
                                    className="w-full py-3 px-4 rounded-xl bg-[#08264e] hover:bg-[#0b3368] text-white font-bold text-xs text-center transition-colors block mt-6"
                                >
                                    {__('Comenzar Plan Trimestral')}
                                </Link>
                            </div>

                            {/* Plan 3: Semestral (DESTACADO / POPULAR) */}
                            <div className="bg-white border-2 border-[#ff5a00] p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-2xl transition-all relative transform lg:-translate-y-2">
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#ff5a00] to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md shrink-0 whitespace-nowrap">
                                    {__('★ Más Popular - Ahorra 15%')}
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#08264e]">{__('Plan Semestral')}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{__('El equilibrio perfecto para crecer')}</p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#08264e] font-mono">$26.50</span>
                                            <span className="text-xs font-bold text-slate-500">/ {__('mes')}</span>
                                        </div>
                                        <p className="text-xs text-[#ff5a00] font-bold mt-1">{__('Facturado $159 cada 6 meses')}</p>
                                    </div>

                                    <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 font-medium">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Todo lo del Plan Trimestral')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Sincronización automática de tasa')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('WhatsApp Engine multi-usuario')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Soporte prioritario por WhatsApp')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/register"
                                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs text-center transition-all shadow-lg shadow-orange-500/25 block mt-6"
                                >
                                    {__('Elegir Plan Semestral')}
                                </Link>
                            </div>

                            {/* Plan 4: Anual (MEJOR VALOR) */}
                            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative">
                                <div className="space-y-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
                                        {__('Mejor Valor - Ahorra 30%')}
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#08264e]">{__('Plan Anual')}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{__('Máximo ahorro y soporte continuo')}</p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-[#08264e] font-mono">$24.00</span>
                                            <span className="text-xs font-bold text-slate-500">/ {__('mes')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1">{__('Facturado $288 al año')}</p>
                                    </div>

                                    <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4 font-medium">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Sucursales y Cajas Ilimitadas')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Ventas a crédito y cobranza')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Auditoría estricta de transacciones')}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{__('Asesor técnico dedicado')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/register"
                                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs text-center transition-colors block mt-6"
                                >
                                    {__('Obtener Plan Anual')}
                                </Link>
                            </div>

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
                                            className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 border ${
                                                submitFeedback.type === 'success'
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                            }`}
                                        >
                                            <CheckCircle2
                                                className={`w-5 h-5 shrink-0 ${
                                                    submitFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
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
